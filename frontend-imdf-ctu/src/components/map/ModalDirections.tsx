import {
  ArrowRightLeft,
  Building2,
  Crosshair,
  GraduationCap,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { SearchResultItem } from '../../utils/searchUtils'
import { useNavigateContext } from '../../context/NavigateContext'
import { searchExternalPlaces } from './Placesearchservice'
import {
  createMyLocationItem,
  MAIN_ENTRANCE_COORDINATE,
  MAIN_ENTRANCE_HEX,
} from './OutdoorRoutingService'
import { fetchIndoorShortestPath } from '../../services/indoorRoutingService'

// Gợi ý khi gõ: tìm trong nhà ngay lập tức + địa điểm bên ngoài (Photon)
function usePlaceSearch(text: string): SearchResultItem[] {
  const { searchItems, suggestions } = useNavigateContext()
  const [external, setExternal] = useState<SearchResultItem[]>([])

  const query = text.trim()

  useEffect(() => {
    if (!query) {
      setExternal([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchExternalPlaces(query, controller.signal, 4)
        .then(setExternal)
        .catch(() => {})
    }, 500)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return query ? [...searchItems(query), ...external] : suggestions
}

export default function ModalDirections() {
  const { showDirectionsModal, selectedDestination } = useNavigateContext()
  return showDirectionsModal ? <DirectionsForm key={selectedDestination?.id} /> : null
}

function DirectionsForm() {
  const navigateCtx = useNavigateContext()
  const {
    selectedDestination,
    selectDestination,
    setShowDirectionsModal,
    setIsLocationModalOpen,
    locate,
    isLocating,
    locationError,
    calculateRoute,
    clearRoute,
    isRouting,
    routeError,
    setIndoorRouteData,
    setIndoorRouteError,
    indoorRouteError,
    loadFloorData,
    floorLevelIds,
  } = navigateCtx

  const [origin, setOrigin] = useState<SearchResultItem | null>(null)
  const [destination, setDestination] = useState<SearchResultItem | null>(selectedDestination)
  const [swapTick, setSwapTick] = useState(0)

  const handleUseMyLocation = async () => {
    const position = await locate()
    if (position) setOrigin(createMyLocationItem(position))
  }

  const handleSwap = () => {
    setOrigin(destination)
    setDestination(origin)
    setSwapTick((t) => t + 1)
  }

  const resolveLocationEntityId = (item: SearchResultItem): number | null => {
    const candidates =
      item.category === 'unit'
        ? [
            item.unitId,
            item.rawProperties?.unit_id,
            item.rawProperties?.unitId,
            item.rawProperties?.id,
            item.id,
          ]
        : [item.rawProperties?.id, item.id]

    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined || candidate === '') continue
      const parsed = Number(candidate)
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed
      }
    }
    return null
  }

  const switchToLevel = async (levelId: number | null | undefined) => {
    if (levelId == null) return
    const floorEntry = Object.entries(floorLevelIds).find(([, id]) => id === levelId)
    if (floorEntry) {
      navigateCtx.setSelectedFloor?.(floorEntry[0])
    }
    await loadFloorData(levelId)
  }

  const handleStart = async () => {
    if (!origin || !destination) return

    const isOutdoorOrigin = origin.category === 'place'
    const isOutdoorDest = destination.category === 'place'

    const mainEntranceItem: SearchResultItem = {
      id: MAIN_ENTRANCE_HEX,
      title: 'Cổng chính',
      subtitle: 'Cổng chính trường CNTT & TT',
      category: 'place',
      coordinates: MAIN_ENTRANCE_COORDINATE,
    }

    try {
      setIndoorRouteError(null)

      // 1. Hoàn toàn trong tòa nhà (cùng tầng hoặc khác tầng)
      if (!isOutdoorOrigin && !isOutdoorDest) {
        if (origin.levelId == null || destination.levelId == null) {
          throw new Error('Thiếu thông tin tầng của điểm bắt đầu hoặc điểm đến')
        }

        const sourceNodeId = resolveLocationEntityId(origin)
        const targetNodeId = resolveLocationEntityId(destination)

        if (sourceNodeId == null || targetNodeId == null) {
          throw new Error('Không xác định được ID điểm đi hoặc điểm đến')
        }

        clearRoute?.()
        const payload: any = {
          sourceAnchorId: sourceNodeId,
          targetAnchorId: targetNodeId,
          sourceNodeId,
          sourceLocationType: origin.category,
          targetNodeId,
          targetLocationType: destination.category,
          sourceLevelId: origin.levelId,
          targetLevelId: destination.levelId,
          isOutdoorIncluded: false,
        }

        const data = await fetchIndoorShortestPath(payload)
        if (destination.id !== selectedDestination?.id) selectDestination(destination)
        setIndoorRouteData(data)

        // Vào đúng tầng xuất phát ban đầu
        await switchToLevel(origin.levelId)

        setShowDirectionsModal(false)
        setIsLocationModalOpen(true)
        return
      }

      if (destination.id !== selectedDestination?.id) selectDestination(destination)

      // 2a. Ngoài trời -> Trong nhà: OSRM tới cổng chính + Indoor từ cổng chính tới đích
      if (isOutdoorOrigin && !isOutdoorDest) {
        if (destination.levelId == null) {
          throw new Error('Thiếu thông tin tầng của điểm đến')
        }
        const targetNodeId = resolveLocationEntityId(destination)
        if (targetNodeId == null) {
          throw new Error('Không xác định được ID điểm đến')
        }

        const ok = await calculateRoute(origin, mainEntranceItem)
        if (!ok) return

        const indoorData = await fetchIndoorShortestPath({
          sourceAnchorId: 0,
          targetAnchorId: targetNodeId,
          sourceNodeId: null,
          sourceLocationType: 'anchor',
          targetNodeId,
          targetLocationType: destination.category,
          sourceLevelId: null,
          targetLevelId: destination.levelId,
          isOutdoorIncluded: true,
        } as any)
        setIndoorRouteData(indoorData)

        const entranceLevelId = Object.values(floorLevelIds).sort((a, b) => a - b)[0]
        await switchToLevel(entranceLevelId)

        setShowDirectionsModal(false)
        setIsLocationModalOpen(true)
        return
      }

      // 2b. Trong nhà -> Ngoài trời: Indoor từ điểm xuất phát ra cổng chính + OSRM từ cổng chính tới đích
      if (!isOutdoorOrigin && isOutdoorDest) {
        if (origin.levelId == null) {
          throw new Error('Thiếu thông tin tầng của điểm bắt đầu')
        }
        const sourceNodeId = resolveLocationEntityId(origin)
        if (sourceNodeId == null) {
          throw new Error('Không xác định được ID điểm đi')
        }

        const ok = await calculateRoute(mainEntranceItem, destination)
        if (!ok) return

        const indoorData = await fetchIndoorShortestPath({
          sourceAnchorId: sourceNodeId,
          targetAnchorId: 0,
          sourceNodeId,
          sourceLocationType: origin.category,
          targetNodeId: null,
          targetLocationType: 'anchor',
          sourceLevelId: origin.levelId,
          targetLevelId: null,
          isOutdoorIncluded: true,
        } as any)
        setIndoorRouteData(indoorData)

        await switchToLevel(origin.levelId)

        setShowDirectionsModal(false)
        setIsLocationModalOpen(true)
        return
      }

      // 2c. Ngoài trời -> Ngoài trời
      setIndoorRouteData(null)
      const ok = await calculateRoute(origin, destination)
      if (ok) {
        setShowDirectionsModal(false)
        setIsLocationModalOpen(true)
      }
    } catch (error) {
      console.error('Lỗi khi tìm đường đi:', error)
      setIndoorRouteError(error instanceof Error ? error.message : 'Không thể tìm đường đi')
    }
  }

  const canStart = !!origin && !!destination && !isRouting
  const hint =
    locationError ??
    routeError ??
    indoorRouteError ??
    (!origin ? 'Vui lòng chọn điểm bắt đầu' : !destination ? 'Vui lòng chọn điểm đến' : '')

  return (
    <div className="absolute inset-0 z-2000 isolate flex items-start justify-center sm:items-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={() => setShowDirectionsModal(false)}
      />

      <div className="relative z-10 w-full sm:max-w-md md:max-w-lg bg-white/98 backdrop-blur-xl rounded-b-3xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.35)] ring-1 ring-black/5 max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 rounded-2xl bg-linear-to-br from-blue-600 to-sky-500 p-2.5 shadow-lg shadow-blue-500/20">
              <Navigation size={18} className="text-white fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Tìm đường đi</h2>
              <p className="text-[11px] text-slate-500">Chọn điểm bắt đầu và điểm đến</p>
            </div>
          </div>
          <button
            onClick={() => setShowDirectionsModal(false)}
            className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4 flex-1">
          <PlaceField
            key={`origin-${swapTick}`}
            label="Điểm bắt đầu"
            dotClass="bg-blue-500 ring-blue-200"
            placeholder="Tìm vị trí bắt đầu..."
            value={origin}
            onSelect={setOrigin}
            onUseMyLocation={handleUseMyLocation}
            isLocating={isLocating}
          />

          <div className="flex items-center justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className="rounded-full p-2 border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-blue-600 active:scale-90 transition cursor-pointer shadow-sm"
              title="Đổi chiều đi / đến"
            >
              <ArrowRightLeft size={15} className="rotate-90" />
            </button>
          </div>

          <PlaceField
            key={`dest-${swapTick}`}
            label="Điểm đến"
            dotClass="bg-red-500 ring-red-200"
            placeholder="Tìm điểm đến..."
            value={destination}
            onSelect={setDestination}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 sm:px-5 py-3 sm:py-4 bg-white/90">
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-sky-600 py-3 px-4 font-bold text-sm text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-sky-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRouting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Đang tìm đường đi...</span>
              </>
            ) : (
              <>
                <Navigation size={17} className="fill-current" />
                <span>Bắt đầu chỉ đường</span>
              </>
            )}
          </button>
          {hint && !isRouting && (
            <p className="text-center text-[11px] text-slate-400 mt-2">{hint}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ────────────────── Ô NHẬP ĐỊA ĐIỂM + GỢI Ý ────────────────── */
interface PlaceFieldProps {
  label: string
  dotClass: string
  placeholder: string
  value: SearchResultItem | null
  onSelect: (item: SearchResultItem | null) => void
  onUseMyLocation?: () => void
  isLocating?: boolean
}

function PlaceField({
  label,
  dotClass,
  placeholder,
  value,
  onSelect,
  onUseMyLocation,
  isLocating,
}: PlaceFieldProps) {
  const [text, setText] = useState(value?.title ?? '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const results = usePlaceSearch(text)

  useEffect(() => {
    if (value) setText(value.title)
  }, [value])

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const pick = (item: SearchResultItem) => {
    onSelect(item)
    setText(item.title)
    setOpen(false)
  }

  const handleLocate = () => {
    setOpen(false)
    onUseMyLocation?.()
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        <div className={`w-2.5 h-2.5 rounded-full ring-2 ${dotClass}`} />
        <span>{label}</span>
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={15}
          />
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onSelect(null)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-100 placeholder:text-slate-400"
          />
          {text && (
            <button
              type="button"
              onClick={() => {
                setText('')
                onSelect(null)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {onUseMyLocation && (
          <button
            type="button"
            onClick={handleLocate}
            disabled={isLocating}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-sky-50 hover:text-blue-600 hover:border-sky-300 transition cursor-pointer whitespace-nowrap"
            title="Định vị vị trí của tôi"
          >
            <Crosshair size={15} className={isLocating ? 'animate-spin text-blue-600' : ''} />
            <span className="hidden sm:inline">Vị trí của tôi</span>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white/98 p-1.5 shadow-xl backdrop-blur-md z-2100">
          {onUseMyLocation && (
            <>
              <div
                onClick={handleLocate}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition hover:bg-blue-50"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Crosshair size={14} />
                </div>
                <div>
                  <span className="text-sm font-bold text-blue-700">Vị trí của tôi</span>
                  <p className="text-[11px] text-slate-500">Sử dụng GPS định vị</p>
                </div>
              </div>
              <div className="h-px bg-slate-100 mx-1 my-1" />
            </>
          )}

          {results.length === 0 ? (
            <div className="py-3 text-center text-xs text-slate-500">
              Không tìm thấy địa điểm phù hợp
            </div>
          ) : (
            <>
              {!text.trim() && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles size={10} className="text-amber-500" />
                  <span>Gợi ý</span>
                </div>
              )}
              {results.map((item) => (
                <SuggestionItem key={item.id} item={item} onClick={() => pick(item)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SuggestionItem({ item, onClick }: { item: SearchResultItem; onClick: () => void }) {
  const isRoom = item.category === 'unit' || item.category === 'anchor'
  const isPlace = item.category === 'place'
  const Icon = isRoom ? GraduationCap : isPlace ? MapPin : Building2
  const color = isRoom ? 'bg-emerald-500' : isPlace ? 'bg-amber-500' : 'bg-sky-600'

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition hover:bg-sky-50 active:bg-sky-100"
    >
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${color}`}
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-800 group-hover:text-sky-700">
          {item.title}
        </span>
        <p className="text-[11px] text-slate-500 truncate">{item.subtitle || item.address || ''}</p>
      </div>
    </div>
  )
}
