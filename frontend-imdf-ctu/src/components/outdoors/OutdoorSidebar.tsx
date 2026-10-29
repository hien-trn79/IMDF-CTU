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
  selectedTable: string
  onTableChange: (table: string) => void
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
  onImportGeoJson,
  selectedTable,
  onTableChange,
  onPublish,
  isPublishing = false,
  roleLabel = 'ADMIN',
}: OutdoorSidebarProps) {
  const { refreshLayers, isLoadingLayers, layerCatalogError, availableLayers } = useLayer()
  const { token } = useUser()

  const [buildings, setBuildings] = useState<BuildingGeoJson['features'] | []>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false)
  const [buildingsError, setBuildingsError] = useState<string | null>(null)

  const [isLoadingLevels, setIsLoadingLevels] = useState(false)
  const [levelsError, setLevelsError] = useState<string | null>(null)
  const [activeLevelId, setActiveLevelId] = useState<string>('')

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
  }, [selectedBuildingId, token, setLevels])

  const handleBuildingClick = (buildingId: string | number) => {
    const id = Number(buildingId)
    if (Number.isNaN(id) || id === selectedBuildingId) return
    setSelectedBuildingId(id)
  }

  const handleLevelChange = (levelId: string) => {
    setActiveLevelId(levelId)
    onLevelChange?.(levelId || null)
  }

  const tableOptions = [
    { value: 'anchor', label: 'Anchor - Điểm neo' },
    { value: 'amenity', label: 'Amenity - Tiện ích' },
    { value: 'unit', label: 'Unit - Phòng' },
    { value: 'level', label: 'Level - Tầng' },
    ...availableLayers
      .map((layer) => layer.layerName.split(':').pop() ?? layer.layerName)
      .filter(
        (name, index, names) =>
          name &&
          !['anchor', 'amenity', 'unit', 'level'].includes(name) &&
          names.indexOf(name) === index
      )
      .map((name) => ({
        value: name,
        label: `${name.charAt(0).toUpperCase()}${name.slice(1)} - Dữ liệu bản đồ`,
      })),
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
        <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-sm font-bold text-emerald-700 shadow-sm hover:border-emerald-400 hover:bg-emerald-100">
          <UploadCloud className="h-4 w-4" />
          Thêm dữ liệu GeoJSON
          <input
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onImportGeoJson?.(file)
              event.target.value = ''
            }}
          />
        </label>

        <button
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
        )}
      </section>

      {/* ============ CARD 2: DANH MỤC TÒA NHÀ CHỨA DỮ LIỆU NỘI KHU ============ */}
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
        <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-2">
          {isLoadingBuildings ? (
            <p className="flex items-center gap-2 px-2 py-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </p>
          ) : buildingsError ? (
            <p className="rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-600">
              {buildingsError}
            </p>
          ) : buildings.length > 0 ? (
            buildings.map((building) => {
              const isActive = String(building.id) === String(selectedBuildingId)
              return (
                <div
                  key={building.id}
                  className={`rounded-xl border transition-all duration-150 ${
                    isActive
                      ? 'border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-200'
                      : 'border-transparent bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  <button
                    onClick={() => handleBuildingClick(building.id)}
                    role="radio"
                    aria-checked={isActive}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150
                    ${isActive ? 'text-sky-800' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {/* radio indicator */}
                    <span
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isActive ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>

                    <span className="flex-1 truncate text-xs font-semibold">
                      {building.properties.buildingName}
                    </span>

                    {/* badge số tầng (chỉ tòa nhà đang chọn mới biết số tầng) */}
                    {isActive && (
                      <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                        {isLoadingLevels ? '…' : `${levels.length} tầng`}
                      </span>
                    )}
                  </button>
                  {isActive && (
                    <div className="border-t border-sky-200 px-3 pb-3 pt-2">
                      <label
                        htmlFor={`data-table-select-${building.id}`}
                        className="mb-1 block text-[11px] font-semibold text-slate-500"
                      >
                        Bảng dữ liệu của tòa nhà
                      </label>
                      <div className="relative">
                        <select
                          id={`data-table-select-${building.id}`}
                          value={selectedTable}
                          onChange={(event) => onTableChange(event.target.value)}
                          className="h-9 w-full appearance-none rounded-lg border border-sky-200 bg-white px-2.5 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        >
                          {tableOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="px-2 py-2 text-sm text-slate-500">Không có tòa nhà nào.</p>
          )}
        </div>
      </section>
    </aside>
  )
}
