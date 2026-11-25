import {
  Building2,
  Compass,
  Layers3,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useLevel } from '../../context/LevelContext'
import { useUser } from '../../context/UserContext'
import type { VenueGeoJson, BuildingGeoJson, LevelGeoJson } from '../../model/geoJsonEntity.model'

const API_BASE = 'http://localhost:8081/api'

interface OutdoorSidebarProps {
  objectCount: number
  setIsOpenAddModal: (isOpen: boolean) => void
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
  onReload?: () => void
  onBuildingCoordinatesChange?: (coords: [number, number] | null) => void
}

export default function OutdoorSidebar({
  objectCount: _objectCount,
  setIsOpenAddModal,
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
  onReload,
  onBuildingCoordinatesChange,
}: OutdoorSidebarProps) {
  const { dataVersion, reloadUnits, reloadData } = useLevel()
  const { token } = useUser()

  const [venues, setVenues] = useState<VenueGeoJson>()
  const [selectedVenueId, setSelectedVenueId] = useState<number>(2)

  const [buildings, setBuildings] = useState<BuildingGeoJson['features'] | []>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false)
  const [buildingsError, setBuildingsError] = useState<string | null>(null)

  const [isLoadingLevels, setIsLoadingLevels] = useState(false)
  const [levelsError, setLevelsError] = useState<string | null>(null)
  const [activeLevelId, setActiveLevelId] = useState<string>('')

  const isLoadingLayers = isLoadingBuildings || isLoadingLevels

  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // 1. Fetch danh sách Venues
  useEffect(() => {
    let isMounted = true
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_BASE}/venues`, { headers: authHeaders })
        if (res.ok) {
          const data: VenueGeoJson = await res.json()
          if (!isMounted) return
          setVenues(data)
          if (data.features && data.features.length > 0) {
            if (!selectedVenueId || !data.features.some((v) => Number(v.id) === selectedVenueId)) {
              setSelectedVenueId(Number(data.features[0].id))
            }
          }
        }
      } catch (err) {
        console.error('Error fetching venues:', err)
      }
    }
    if (token) fetchVenues()
    return () => {
      isMounted = false
    }
  }, [token])

  // 2. Fetch danh sách tòa nhà theo Venue
  useEffect(() => {
    let isMounted = true
    if (!selectedVenueId) {
      setBuildings([])
      return
    }

    const controller = new AbortController()
    const fetchBuildings = async () => {
      setIsLoadingBuildings(true)
      setBuildingsError(null)
      try {
        const res = await fetch(
          `${API_BASE}/buildings?venueId=${selectedVenueId}&page=0&size=100&sort=id%2CASC`,
          {
            headers: authHeaders,
            signal: controller.signal,
          }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: BuildingGeoJson = await res.json()
        const features = data.features ?? []
        if (!isMounted) return
        setBuildings(features)

        const exists = features.some((b) => Number(b.id) === selectedBuildingId)
        if (!exists && features.length > 0) {
          const firstId = Number(features[0].id)
          if (!Number.isNaN(firstId)) {
            setSelectedBuildingId(firstId)
            if (features[0].properties?.displayPoint?.coordinates) {
              const [lng, lat] = features[0].properties.displayPoint.coordinates
              onBuildingCoordinatesChange?.([lat, lng])
            }
          }
        } else if (features.length === 0) {
          setSelectedBuildingId(0)
          setLevels([])
          setActiveLevelId('')
          onLevelChange?.(null)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Error fetching buildings:', err)
        if (isMounted) {
          setBuildings([])
          setBuildingsError('Không tải được danh sách tòa nhà.')
        }
      } finally {
        if (isMounted) setIsLoadingBuildings(false)
      }
    }

    if (token) fetchBuildings()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [selectedVenueId, token])

  // 3. Fetch tầng theo tòa nhà
  useEffect(() => {
    let isMounted = true
    if (!selectedBuildingId) {
      setLevels([])
      setActiveLevelId('')
      onLevelChange?.(null)
      return
    }

    // Cập nhật tọa độ building
    const currentBuilding = buildings.find((b) => Number(b.id) === selectedBuildingId)
    if (currentBuilding?.properties?.displayPoint?.coordinates) {
      const [lng, lat] = currentBuilding.properties.displayPoint.coordinates
      onBuildingCoordinatesChange?.([lat, lng])
    }

    const controller = new AbortController()
    const fetchLevels = async () => {
      setIsLoadingLevels(true)
      setLevelsError(null)

      try {
        const res = await fetch(`${API_BASE}/levels?buildingId=${selectedBuildingId}`, {
          headers: authHeaders,
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: LevelGeoJson = await res.json()
        if (!isMounted) return
        const sorted = [...(data.features ?? [])].sort(
          (a, b) => Number(a.properties.ordinal) - Number(b.properties.ordinal)
        )
        setLevels(sorted as LevelGeoJson['features'])

        if (sorted.length > 0) {
          const currentExists = sorted.some((l) => String(l.id) === activeLevelId)
          const chosenId = currentExists ? activeLevelId : String(sorted[0].id)
          setActiveLevelId(chosenId)
          onLevelChange?.(chosenId)
        } else {
          // Tòa nhà chưa có tầng
          setActiveLevelId('')
          onLevelChange?.(null)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Lỗi khi fetch levels:', err)
        if (isMounted) {
          setLevels([])
          setActiveLevelId('')
          onLevelChange?.(null)
          setLevelsError('Không tải được danh sách tầng.')
        }
      } finally {
        if (isMounted) setIsLoadingLevels(false)
      }
    }

    if (token) fetchLevels()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [selectedBuildingId, buildings, token, dataVersion])

  const handleLevelChange = (levelId: string) => {
    setActiveLevelId(levelId)
    onLevelChange?.(levelId || null)
  }

  const tableOptions = [
    { value: 'unit', label: 'Unit - Phòng' },
    { value: 'anchors', label: 'Anchor - Điểm neo' },
    { value: 'amenities', label: 'Amenity - Tiện ích' },
    { value: 'level', label: 'Level - Tầng' },
  ]

  const handleRefresh = () => {
    reloadUnits()
    reloadData()
    onReload?.()
  }

  const handleDrawClick = () => {
    if (!activeLevelId) {
      message.warning(
        'Tòa nhà hiện tại chưa có Tầng (Level). Vui lòng cấu hình Tầng trước khi vẽ đối tượng!'
      )
      return
    }
    setIsOpenAddModal(true)
  }

  return (
    <aside className="page-ourdoor-sidebar w-full shrink-0 space-y-2 sm:w-70 lg:w-72.5">
      {/* ================= CARD 1: QUẢN LÝ ĐỊA ĐIỂM (IMDF) ================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
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

        <div className="space-y-3">
          {/* Chọn Venue */}
          <div className="mb-3">
            <label
              htmlFor="venue-select"
              className="mb-1 flex items-center text-xs font-semibold text-blue-700"
            >
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              Chọn Venue:
            </label>
            <select
              id="venue-select"
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(Number(e.target.value))}
              className="h-11 w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
            >
              {venues && venues.features.length > 0 ? (
                venues.features.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.properties.venueName}
                  </option>
                ))
              ) : (
                <option value="">-- Chưa có Venue --</option>
              )}
            </select>
          </div>

          {/* Chọn Building */}
          <div className="mb-3">
            <label
              htmlFor="building-select"
              className="mb-1 flex items-center text-xs font-semibold text-blue-700"
            >
              <Building2 className="mr-1 inline h-3.5 w-3.5" />
              Chọn Building:
            </label>
            <select
              id="building-select"
              value={selectedBuildingId || ''}
              onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
              disabled={isLoadingBuildings || buildings.length === 0}
              className="h-11 w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isLoadingBuildings ? (
                <option value="">Đang tải danh sách tòa nhà...</option>
              ) : buildings.length > 0 ? (
                buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.properties.buildingName}
                  </option>
                ))
              ) : (
                <option value="">-- Chưa cấu hình Tòa nhà --</option>
              )}
            </select>
          </div>

          {/* Chọn Tầng (Level) */}
          <div className="mb-2">
            <label
              htmlFor="level-select"
              className="mb-1 flex items-center text-xs font-semibold text-blue-700"
            >
              <Compass className="mr-1 inline h-3.5 w-3.5" />
              Chọn Tầng (Level):
            </label>
            <select
              id="level-select"
              value={activeLevelId}
              onChange={(e) => handleLevelChange(e.target.value)}
              disabled={isLoadingLevels || levels.length === 0}
              className={`h-11 w-full cursor-pointer appearance-none rounded-2xl border bg-slate-50 px-3.5 text-sm font-bold outline-none transition
                focus:border-sky-400 focus:bg-white
                disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400
                ${activeLevelId ? 'border-sky-200 text-slate-800' : 'border-slate-200 text-slate-500'}`}
            >
              {isLoadingLevels ? (
                <option value="">Đang tải tầng...</option>
              ) : levels.length > 0 ? (
                levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    Tầng {level.properties.ordinal}
                  </option>
                ))
              ) : (
                <option value="">-- Tòa nhà chưa cấu hình Tầng --</option>
              )}
            </select>
            {levelsError && <p className="mt-1 text-[11px] text-red-600">{levelsError}</p>}
          </div>
        </div>
      </section>

      {/* ================= CARD 2: BẢNG LỚP DỮ LIỆU IMDF (GIỐNG ROUTE) ================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 text-sm font-bold text-blue-700">
          <span className="flex items-center gap-2">
            <Layers3 className="h-4 w-4" />
            Bảng lớp dữ liệu IMDF
          </span>
        </div>

        {/* Nút Làm mới & Vẽ đối tượng */}
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={handleRefresh}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoadingLayers ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleDrawClick}
            title="Thêm feature mới lên tầng đang chọn"
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Vẽ đối tượng
          </button>
        </div>

        {/* Khung tabs chọn bảng dữ liệu giống hệt bên Route */}
        <ul
          role="listbox"
          aria-label="Danh sách lớp dữ liệu IMDF"
          className="mt-2 ml-1 max-h-68 space-y-0.5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5"
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
                className={`relative flex shrink-0 whitespace-nowrap px-2.5 py-2 text-xs font-semibold transition-colors w-full text-left ${
                  isTabActive
                    ? 'text-sky-700 font-bold bg-sky-50/70 rounded-lg'
                    : 'text-slate-500 hover:text-slate-700'
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

        {/* Nút Thêm dữ liệu GeoJSON */}
        <label className="mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-700 shadow-xs hover:border-emerald-400 hover:bg-emerald-100 transition">
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
      </section>
    </aside>
  )
}
