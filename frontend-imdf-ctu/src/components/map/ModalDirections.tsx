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
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMapNavigation } from '../../context/MapNavigationContext'
import type { DestinationItem } from '../../model/Navigation.model'
import { searchLocations } from '../../services/mapNavigationService'

export default function ModalDirections() {
  const {
    allLocations,
    userLocation,
    refreshUserLocation,
    isLocating,
    locationError,
    showDirectionsModal,
    setShowDirectionsModal,
    selectedDestination,
    calculateRouteWithOrigin,
    isRouting,
  } = useMapNavigation()

  // State cho điểm bắt đầu
  const [originText, setOriginText] = useState('')
  const [originLocation, setOriginLocation] = useState<[number, number] | null>(null)
  const [originDestination, setOriginDestination] = useState<DestinationItem | null>(null)
  const [originSuggestions, setOriginSuggestions] = useState<DestinationItem[]>([])
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [isUsingMyLocation, setIsUsingMyLocation] = useState(false)

  // State cho điểm đến
  const [destText, setDestText] = useState('')
  const [destLocation, setDestLocation] = useState<DestinationItem | null>(null)
  const [destSuggestions, setDestSuggestions] = useState<DestinationItem[]>([])
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)

  const originInputRef = useRef<HTMLInputElement>(null)
  const destInputRef = useRef<HTMLInputElement>(null)
  const originContainerRef = useRef<HTMLDivElement>(null)
  const destContainerRef = useRef<HTMLDivElement>(null)

  // Đồng bộ khi mở modal
  useEffect(() => {
    if (showDirectionsModal && selectedDestination) {
      setDestText(selectedDestination.title)
      setDestLocation(selectedDestination)
      setOriginText('')
      setOriginLocation(null)
      setOriginDestination(null)
      setIsUsingMyLocation(false)
      setTimeout(() => originInputRef.current?.focus(), 100)
    }
  }, [showDirectionsModal, selectedDestination])

  // Autocomplete cho Origin
  useEffect(() => {
    if (!originText.trim() || isUsingMyLocation) {
      setOriginSuggestions([])
      return
    }
    const results = searchLocations(originText, allLocations)
    setOriginSuggestions(results.slice(0, 8))
  }, [originText, allLocations, isUsingMyLocation])

  // Autocomplete cho Destination
  useEffect(() => {
    if (!destText.trim()) {
      setDestSuggestions([])
      return
    }
    const results = searchLocations(destText, allLocations)
    setDestSuggestions(results.slice(0, 8))
  }, [destText, allLocations])

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (originContainerRef.current && !originContainerRef.current.contains(e.target as Node)) {
        setShowOriginSuggestions(false)
      }
      if (destContainerRef.current && !destContainerRef.current.contains(e.target as Node)) {
        setShowDestSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Xử lý nút Định vị vị trí cá nhân
  const handleUseMyLocation = useCallback(() => {
    refreshUserLocation()
    setIsUsingMyLocation(true)
    setOriginText('Vị trí của tôi')
    setShowOriginSuggestions(false)
  }, [refreshUserLocation])

  // Cập nhật origin khi GPS trả về
  useEffect(() => {
    if (isUsingMyLocation && userLocation) {
      setOriginLocation(userLocation)
    }
  }, [isUsingMyLocation, userLocation])

  // Chọn địa điểm origin từ gợi ý
  const handleSelectOrigin = (dest: DestinationItem) => {
    setOriginText(dest.title)
    setOriginLocation(dest.coordinates)
    setOriginDestination(dest)
    setIsUsingMyLocation(false)
    setShowOriginSuggestions(false)
  }

  // Chọn địa điểm dest từ gợi ý
  const handleSelectDest = (dest: DestinationItem) => {
    setDestText(dest.title)
    setDestLocation(dest)
    setShowDestSuggestions(false)
  }

  // Đổi chiều origin/dest
  const handleSwap = () => {
    const tmpText = originText
    const tmpLoc = originLocation
    const tmpUsingMyLoc = isUsingMyLocation

    setOriginText(destText)
    setOriginLocation(destLocation?.coordinates || null)
    setOriginDestination(destLocation)
    setIsUsingMyLocation(false)

    if (tmpUsingMyLoc && userLocation) {
      // Tạo custom destination từ vị trí user
      setDestText(tmpText)
      setDestLocation({
        id: 'my-location',
        title: 'Vị trí của tôi',
        category: 'custom',
        coordinates: userLocation,
        address: 'Vị trí GPS hiện tại',
      })
      setOriginDestination(null)
    } else if (tmpLoc) {
      const found = allLocations.find(
        (loc) => loc.coordinates[0] === tmpLoc[0] && loc.coordinates[1] === tmpLoc[1]
      )
      setDestText(tmpText)
      setDestLocation(
        found || {
          id: 'custom-origin',
          title: tmpText,
          category: 'custom',
          coordinates: tmpLoc,
          address: tmpText,
        }
      )
      setOriginDestination(null)
    }
  }

  // Bắt đầu tìm đường
  const handleStartNavigation = async () => {
    const origin = isUsingMyLocation ? userLocation : originLocation
    if (!origin || !destLocation) return
    await calculateRouteWithOrigin(
      origin,
      destLocation,
      isUsingMyLocation ? undefined : (originDestination ?? undefined)
    )
  }

  const canNavigate =
    (originLocation || (isUsingMyLocation && userLocation)) && destLocation && !isRouting

  if (!showDirectionsModal) return null

  // Gợi ý phổ biến khi chưa gõ
  const popularOrigins = allLocations
    .filter((loc) => loc.roomCode || loc.category === 'building')
    .slice(0, 5)

  return (
    <div className="absolute inset-0 z-2000 isolate flex items-start justify-center sm:items-center p-0 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={() => setShowDirectionsModal(false)}
      />

      {/* Modal Content */}
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
            className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4 flex-1">
          {/* Điểm bắt đầu */}
          <div ref={originContainerRef} className="relative">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
              <span>Điểm bắt đầu</span>
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={15}
                />
                <input
                  ref={originInputRef}
                  value={originText}
                  onChange={(e) => {
                    setOriginText(e.target.value)
                    setIsUsingMyLocation(false)
                    setOriginLocation(null)
                    setShowOriginSuggestions(true)
                  }}
                  onFocus={() => setShowOriginSuggestions(true)}
                  className={`h-10 w-full rounded-xl border bg-slate-50 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-100 placeholder:text-slate-400 ${
                    isUsingMyLocation
                      ? 'border-blue-400 bg-blue-50/50 text-blue-700 font-medium'
                      : 'border-slate-200'
                  }`}
                  placeholder="Tìm vị trí bắt đầu..."
                  readOnly={isUsingMyLocation}
                />
                {originText && !isUsingMyLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setOriginText('')
                      setOriginLocation(null)
                      setShowOriginSuggestions(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Nút Định vị vị trí cá nhân */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isUsingMyLocation
                    ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-blue-600 hover:border-sky-300'
                }`}
                title="Định vị vị trí của tôi"
              >
                <Crosshair size={15} className={isLocating ? 'animate-spin text-blue-600' : ''} />
                <span className="hidden sm:inline">Vị trí của tôi</span>
              </button>
            </div>

            {/* Gợi ý Origin */}
            {showOriginSuggestions && !isUsingMyLocation && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white/98 p-1.5 shadow-xl backdrop-blur-md z-2100 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                {/* Nút Vị trí của tôi luôn hiển thị trên cùng */}
                <div
                  onClick={handleUseMyLocation}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition hover:bg-blue-50"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Crosshair size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-blue-700">Vị trí của tôi</span>
                    <p className="text-[11px] text-slate-500">Sử dụng GPS định vị</p>
                  </div>
                </div>

                <div className="h-px bg-slate-100 mx-1 my-1" />

                {originText.trim() && originSuggestions.length > 0 ? (
                  originSuggestions.map((s) => (
                    <SuggestionItem key={s.id} item={s} onClick={() => handleSelectOrigin(s)} />
                  ))
                ) : originText.trim() && originSuggestions.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-500">
                    Không tìm thấy địa điểm phù hợp
                  </div>
                ) : (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles size={10} className="text-amber-500" />
                      <span>Gợi ý</span>
                    </div>
                    {popularOrigins.map((s) => (
                      <SuggestionItem key={s.id} item={s} onClick={() => handleSelectOrigin(s)} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Nút Swap */}
          <div className="flex items-center justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className="rounded-full p-2 border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 active:scale-90 transition cursor-pointer shadow-sm"
              title="Đổi chiều đi / đến"
            >
              <ArrowRightLeft size={15} className="rotate-90" />
            </button>
          </div>

          {/* Điểm đến */}
          <div ref={destContainerRef} className="relative">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200" />
              <span>Điểm đến</span>
            </label>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={15}
              />
              <input
                ref={destInputRef}
                value={destText}
                onChange={(e) => {
                  setDestText(e.target.value)
                  setDestLocation(null)
                  setShowDestSuggestions(true)
                }}
                onFocus={() => setShowDestSuggestions(true)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:bg-white focus:ring-3 focus:ring-red-100 placeholder:text-slate-400"
                placeholder="Tìm điểm đến..."
              />
              {destText && (
                <button
                  type="button"
                  onClick={() => {
                    setDestText('')
                    setDestLocation(null)
                    setShowDestSuggestions(false)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Gợi ý Dest */}
            {showDestSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white/98 p-1.5 shadow-xl backdrop-blur-md z-2100 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                {destText.trim() && destSuggestions.length > 0 ? (
                  destSuggestions.map((s) => (
                    <SuggestionItem key={s.id} item={s} onClick={() => handleSelectDest(s)} />
                  ))
                ) : destText.trim() && destSuggestions.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-500">
                    Không tìm thấy địa điểm phù hợp
                  </div>
                ) : (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles size={10} className="text-amber-500" />
                      <span>Gợi ý</span>
                    </div>
                    {popularOrigins.map((s) => (
                      <SuggestionItem key={s.id} item={s} onClick={() => handleSelectDest(s)} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Nút Tìm đường */}
        <div className="border-t border-slate-100 px-4 sm:px-5 py-3 sm:py-4 bg-white/90">
          <button
            type="button"
            onClick={handleStartNavigation}
            disabled={!canNavigate}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-sky-600 py-3 px-4 font-bold text-sm text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-sky-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

          {!canNavigate && !isRouting && (
            <p className="text-center text-[11px] text-slate-400 mt-2">
              {isUsingMyLocation && locationError
                ? locationError
                : !originLocation && !isUsingMyLocation
                  ? 'Vui lòng chọn điểm bắt đầu hoặc sử dụng vị trí GPS'
                  : !destLocation
                    ? 'Vui lòng chọn điểm đến'
                    : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ────────────────── SUGGESTION ITEM ────────────────── */
function SuggestionItem({ item, onClick }: { item: DestinationItem; onClick: () => void }) {
  const isRoom = item.category === 'room'

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition hover:bg-sky-50 active:bg-sky-100"
    >
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm ${
          isRoom
            ? 'bg-emerald-500 text-white'
            : item.category === 'building'
              ? 'bg-sky-600 text-white'
              : 'bg-amber-500 text-white'
        }`}
      >
        {isRoom ? (
          <GraduationCap size={14} />
        ) : item.category === 'building' ? (
          <Building2 size={14} />
        ) : (
          <MapPin size={14} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-slate-800 truncate group-hover:text-sky-700">
            {item.title}
          </span>
          {item.roomCode && (
            <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
              {item.roomCode}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 truncate">{item.subtitle || item.address || ''}</p>
      </div>
    </div>
  )
}
