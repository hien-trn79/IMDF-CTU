import {
  Building2,
  ChevronDown,
  Compass,
  Layers3,
  Loader2,
  Plus,
  RotateCcw,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLayer } from '../../context/LayerContext'
import { useLevel } from '../../context/LevelContext'
import { useUser } from '../../context/UserContext'
import type { BuildingGeoJson, LevelGeoJson } from '../../model/geoJsonEntity.model'

const API_BASE = 'http://localhost:8081/api' // nên chuyển sang import.meta.env.VITE_API_URL

interface OutdoorSidebarProps {
  objectCount: number
  onCreate: () => void
  selectedBuildingId: number
  setSelectedBuildingId: (id: number) => void
  levels: LevelGeoJson['features'] | []
  setLevels: (levels: LevelGeoJson['features'] | []) => void
  onLevelChange?: (levelId: string | null) => void
  onImportGeoJson?: (file: File) => void
  selectedTables: string[]
  onTableChange: (table: string) => void
  onTableToggle: (table: string) => void
  onPublish?: () => void
  isPublishing?: boolean
  roleLabel?: string
}

export default function OutdoorSidebar({
  objectCount: _objectCount,
  onCreate,
  selectedBuildingId,
  setSelectedBuildingId,
  levels,
  setLevels,
  onLevelChange,
  onImportGeoJson: _onImportGeoJson,
  selectedTables,
  onTableChange,
  onTableToggle,
  onPublish: _onPublish,
  isPublishing: _isPublishing = false,
  roleLabel = 'ADMIN',
}: OutdoorSidebarProps) {
  const {
    refreshLayers,
    isLoadingLayers,
    layerCatalogError: _layerCatalogError,
    availableLayers: _availableLayers,
  } = useLayer()
  const { dataVersion } = useLevel()
  const { token } = useUser()

  const [buildings, setBuildings] = useState<BuildingGeoJson['features'] | []>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false)
  const [buildingsError, setBuildingsError] = useState<string | null>(null)

  const [isLoadingLevels, setIsLoadingLevels] = useState(false)
  const [levelsError, setLevelsError] = useState<string | null>(null)
  const [activeLevelId, setActiveLevelId] = useState<string>('')

  const [isBuildingOpen, setIsBuildingOpen] = useState(false)

  const selectedBuilding = buildings.find((b) => String(b.id) === String(selectedBuildingId))

  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // ---------- Fetch danh sách tòa nhà ----------
  useEffect(() => {
    const controller = new AbortController()

    const fetchBuildings = async () => {
      setIsLoadingBuildings(true)
      setBuildingsError(null)
      try {
        const res = await fetch(`${API_BASE}/buildings?page=0&size=100&sort=id%2CASC`, {
          headers: authHeaders,
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: BuildingGeoJson = await res.json()
        const features = data.features ?? []
        setBuildings(features)

        const exists = features.some((b) => String(b.id) === String(selectedBuildingId))
        if (!exists && features.length > 0) {
          const firstId = Number(features[0].id)
          if (!Number.isNaN(firstId)) setSelectedBuildingId(firstId)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Error fetching buildings:', err)
        setBuildings([])
        setBuildingsError('Không tải được danh sách tòa nhà.')
      } finally {
        if (!controller.signal.aborted) setIsLoadingBuildings(false)
      }
    }

    fetchBuildings()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // ---------- Fetch tầng theo tòa nhà ----------
  useEffect(() => {
    if (!selectedBuildingId) return
    const controller = new AbortController()

    const fetchLevels = async () => {
      setIsLoadingLevels(true)
      setLevelsError(null)
      setLevels([])
      setActiveLevelId('')
      onLevelChange?.(null)

      try {
        const res = await fetch(`${API_BASE}/levels?buildingId=${selectedBuildingId}`, {
          headers: authHeaders,
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: LevelGeoJson = await res.json()
        const sorted = [...(data.features ?? [])].sort(
          (a, b) => Number(a.properties.ordinal) - Number(b.properties.ordinal)
        )
        setLevels(sorted as LevelGeoJson['features'])

        // Tự chọn tầng đầu tiên cho giống giao diện mẫu ("Tầng 1")
        if (sorted.length > 0) {
          const firstId = String(sorted[0].id)
          setActiveLevelId(firstId)
          onLevelChange?.(firstId)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Lỗi khi fetch levels:', err)
        setLevels([])
        setLevelsError('Không tải được danh sách tầng.')
      } finally {
        if (!controller.signal.aborted) setIsLoadingLevels(false)
      }
    }

    fetchLevels()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuildingId, token, setLevels, dataVersion])

  const handleLevelChange = (levelId: string) => {
    setActiveLevelId(levelId)
    onLevelChange?.(levelId || null)
  }

  const tableOptions = [
    { value: 'anchors', label: 'Anchor - Điểm neo' },
    { value: 'amenities', label: 'Amenity - Tiện ích' },
    { value: 'unit', label: 'Unit - Phòng' },
    { value: 'level', label: 'Level - Tầng' },
  ]

  return (
    <aside className="page-ourdoor-sidebar w-full shrink-0 space-y-4 sm:w-70 lg:w-72.5">
      {/* ================= CARD 1: QUẢN LÝ INDOOR ================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="flex items-center gap-2 text-sm font-bold text-blue-700">
            <Building2 className="h-4 w-4" />
            Quản lý Indoor (IMDF)
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-600">
            {roleLabel}
          </span>
        </div>
        {/* Chọn tầng */}
        <label
          htmlFor="level-select"
          className="mb-1.5 block px-0.5 text-xs font-semibold text-slate-500"
        >
          Chọn tầng mặt bằng:
        </label>
        <div className="relative mb-3">
          <Compass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            id="level-select"
            value={activeLevelId}
            onChange={(e) => handleLevelChange(e.target.value)}
            disabled={isLoadingLevels || levels.length === 0}
            className={`h-11 w-full cursor-pointer appearance-none rounded-2xl border bg-slate-50 pl-10 pr-10 text-sm font-bold outline-none transition
              focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100
              disabled:cursor-not-allowed disabled:text-slate-400
              ${activeLevelId ? 'border-sky-200 text-slate-800' : 'border-slate-200 text-slate-500'}`}
          >
            <option value="">
              {isLoadingLevels
                ? 'Đang tải tầng...'
                : levels.length === 0
                  ? 'Không có tầng nào'
                  : 'Chọn tầng'}
            </option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                Tầng {level.properties.ordinal}
              </option>
            ))}
          </select>
          {isLoadingLevels ? (
            <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          )}
        </div>
        {levelsError && (
          <p className="-mt-1 mb-3 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-600">
            {levelsError}
          </p>
        )}

        {/* Actions */}
        <div className="mb-3 grid grid-cols-2 gap-2.5">
          <button
            onClick={refreshLayers}
            disabled={isLoadingLayers}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60"
          >
            <RotateCcw className={`h-4 w-4 ${isLoadingLayers ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={onCreate}
            title="Thêm feature mới lên tầng đang chọn"
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Vẽ đối tượng
          </button>
        </div>

        {/* NUT THEM DU LIEU GEOJSON */}
        <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-sm font-bold text-emerald-700 shadow-sm hover:border-emerald-400 hover:bg-emerald-100">
          <UploadCloud className="h-4 w-4" />
          Thêm dữ liệu GeoJSON
          <input
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) _onImportGeoJson?.(file)
              event.target.value = ''
            }}
          />
        </label>

        {/* NUT PUSHLISH LÊN GEOSERVER */}
        {/* <button
          onClick={onPublish}
          disabled={!onPublish || isPublishing}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPublishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          Publish Layer lên GeoServer
        </button>

        {layerCatalogError && (
          <p className="mt-3 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
            Không đọc được danh sách layer: {layerCatalogError}
          </p>
        )} */}
      </section>

      {/* ============ CARD 2: DANH MỤC TÒA NHÀ CHỨA DỮ LIỆU NỘI KHU ============ */}
      {/* DANH MUC TOA NHA; FROM BACKEND */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3 px-0.5">
          <span className="flex items-start gap-2 text-sm font-semibold leading-snug text-slate-700">
            <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            Danh mục tòa nhà
          </span>
          <span className="mt-0.5 shrink-0 whitespace-nowrap text-xs font-semibold text-slate-400">
            {buildings.length} tòa nhà
          </span>
        </div>

        {isLoadingBuildings ? (
          <p className="flex items-center gap-2 px-2 py-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
          </p>
        ) : buildingsError ? (
          <p className="rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-600">{buildingsError}</p>
        ) : buildings.length === 0 ? (
          <p className="px-2 py-2 text-sm text-slate-500">Không có tòa nhà nào.</p>
        ) : (
          <div>
            {/* ===== Tab building lớn (giả lập select) ===== */}
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isBuildingOpen}
              onClick={() => setIsBuildingOpen((v) => !v)}
              className={`flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left transition-all duration-150 ${
                isBuildingOpen
                  ? 'border-sky-300 ring-2 ring-sky-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-slate-400">Tòa nhà</span>
                <span className="block truncate text-sm font-bold text-slate-800">
                  {selectedBuilding?.properties.buildingName ?? 'Chọn tòa nhà'}
                </span>
              </span>

              {selectedBuilding && (
                <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                  {isLoadingLevels ? '…' : `${levels.length} tầng`}
                </span>
              )}

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                  isBuildingOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {/* ===== Danh sách building con (chỉ đóng khi bấm lại ô lớn) ===== */}
            {isBuildingOpen && (
              <ul
                role="listbox"
                aria-label="Danh sách tòa nhà"
                className="mt-2 ml-2 max-h-68 space-y-0.5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5"
              >
                {tableOptions.map((option) => {
                  const isTabActive = selectedTables.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={isTabActive}
                      onClick={() => {
                        onTableToggle(option.value)
                        onTableChange(option.value)
                      }}
                      className={`relative flex shrink-0 whitespace-nowrap px-2.5 py-2 text-xs font-semibold transition-colors ${
                        isTabActive ? 'text-sky-700' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {option.label}
                      <span
                        className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors ${
                          isTabActive ? 'bg-sky-500' : 'bg-transparent'
                        }`}
                      />
                    </button>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    </aside>
  )
}
