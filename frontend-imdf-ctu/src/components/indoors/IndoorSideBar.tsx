import { Building2, Compass, Map, MapPin, Plus, RotateCcw, Waypoints, Loader2 } from 'lucide-react'
import { GRID_LINE_COLOR } from './gridLineGeoJson'
import { useEffect, useState } from 'react'
import type { VenueGeoJson, BuildingGeoJson, LevelGeoJson } from '../../model/geoJsonEntity.model'
import { useLayerContext } from '../../context/LayerContext'
import type { RouteResponse } from '../../model/route models/preTopology.model'
import { useUser } from '../../context/UserContext'
import { message } from 'antd'

interface IndoorSideBarProps {
  isLoading: boolean
  setIsOpenAddIndoor: (open: boolean) => void
  isNodeVisible: boolean
  onToggleNode: (visible: boolean) => void
  edgeCount: number
  isEdgeVisible: boolean
  onToggleEdge: (visible: boolean) => void
  onOpenImportModal?: () => void
  onReload?: () => void
}

export default function IndoorSideBar({
  isLoading,
  setIsOpenAddIndoor,
  onReload,
}: IndoorSideBarProps) {
  const [venues, setVenues] = useState<VenueGeoJson>()
  const [buildings, setBuildings] = useState<BuildingGeoJson>()
  const [levelIndoorIds, setLevelIndoorIds] = useState<LevelGeoJson>()
  const [routeData, setRouteData] = useState<RouteResponse | null>(null)
  const [loadingBuildings, setLoadingBuildings] = useState(false)
  const [loadingLevels, setLoadingLevels] = useState(false)

  const {
    selectedVenueId,
    setSelectedVenueId,
    selectedBuildingId,
    setSelectedBuildingId,
    selectedLevelIndoorId,
    setSelectedLevelIndoorId,
    setBuildingCoordinates,
    selectedTableIndoor,
    setSelectedTableIndoor,
  } = useLayerContext()
  const { token } = useUser()

  // 1. Fetch Venues
  useEffect(() => {
    let isMounted = true
    const fetchVenues = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/venues', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data: VenueGeoJson = await response.json()
          if (!isMounted) return
          setVenues(data)
          if (data.features && data.features.length > 0) {
            if (
              selectedVenueId === null ||
              !data.features.some((v) => Number(v.id) === selectedVenueId)
            ) {
              setSelectedVenueId(Number(data.features[0].id))
            }
          }
        }
      } catch (error) {
        console.error('Error fetching venues:', error)
      }
    }

    if (token) {
      fetchVenues()
    }
    return () => {
      isMounted = false
    }
  }, [token])

  // 2. Fetch Buildings khi selectedVenueId thay đổi
  useEffect(() => {
    let isMounted = true
    if (!selectedVenueId) {
      setBuildings(undefined)
      setSelectedBuildingId(null)
      return
    }

    const fetchBuildings = async () => {
      setLoadingBuildings(true)
      try {
        const response = await fetch(
          `http://localhost:8081/api/buildings?venueId=${selectedVenueId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (response.ok) {
          const data: BuildingGeoJson = await response.json()
          if (!isMounted) return
          setBuildings(data)
          if (data.features && data.features.length > 0) {
            const currentStillExists = data.features.some(
              (b) => Number(b.id) === selectedBuildingId
            )
            if (!currentStillExists) {
              const firstBuilding = data.features[0]
              setSelectedBuildingId(Number(firstBuilding.id))
              if (firstBuilding.properties?.displayPoint?.coordinates) {
                const [lng, lat] = firstBuilding.properties.displayPoint.coordinates
                setBuildingCoordinates([lat, lng])
              }
            }
          } else {
            setSelectedBuildingId(null)
            setLevelIndoorIds(undefined)
            setSelectedLevelIndoorId(null)
            setRouteData(null)
          }
        }
      } catch (error) {
        console.error('Error fetching buildings:', error)
        if (isMounted) {
          setBuildings(undefined)
          setSelectedBuildingId(null)
        }
      } finally {
        if (isMounted) setLoadingBuildings(false)
      }
    }

    if (token && selectedVenueId) {
      fetchBuildings()
    }
    return () => {
      isMounted = false
    }
  }, [selectedVenueId, token])

  // 3. Fetch Levels khi selectedBuildingId thay đổi
  useEffect(() => {
    let isMounted = true
    if (!selectedBuildingId) {
      setLevelIndoorIds(undefined)
      setSelectedLevelIndoorId(null)
      setRouteData(null)
      return
    }

    // Cập nhật tọa độ building cho map pan tới
    const currentBuilding = buildings?.features?.find((b) => Number(b.id) === selectedBuildingId)
    if (currentBuilding?.properties?.displayPoint?.coordinates) {
      const [lng, lat] = currentBuilding.properties.displayPoint.coordinates
      setBuildingCoordinates([lat, lng])
    }

    const fetchLevels = async () => {
      setLoadingLevels(true)
      try {
        const response = await fetch(
          `http://localhost:8081/api/levels?buildingId=${selectedBuildingId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (response.ok) {
          const data: LevelGeoJson = await response.json()
          if (!isMounted) return
          setLevelIndoorIds(data)
          if (data.features && data.features.length > 0) {
            const currentStillExists = data.features.some(
              (level) => String(level.id) === selectedLevelIndoorId
            )
            if (!currentStillExists) {
              setSelectedLevelIndoorId(String(data.features[0].id))
            }
          } else {
            // Tòa nhà này chưa có Level
            setSelectedLevelIndoorId(null)
            setRouteData(null)
          }
        }
      } catch (error) {
        console.error('Error fetching levels:', error)
        if (isMounted) {
          setLevelIndoorIds(undefined)
          setSelectedLevelIndoorId(null)
          setRouteData(null)
        }
      } finally {
        if (isMounted) setLoadingLevels(false)
      }
    }

    if (token && selectedBuildingId) {
      fetchLevels()
    }
    return () => {
      isMounted = false
    }
  }, [selectedBuildingId, buildings, token])

  // 4. Fetch Route khi selectedLevelIndoorId thay đổi
  useEffect(() => {
    let isMounted = true
    if (!selectedLevelIndoorId) {
      setRouteData(null)
      return
    }

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/indoor-routes?levelId=${selectedLevelIndoorId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (response.ok) {
          const data = await response.json()
          if (!isMounted) return
          setRouteData(data && data.length > 0 ? data[0] : null)
        } else {
          if (isMounted) setRouteData(null)
        }
      } catch (error) {
        console.error('Error fetching routes:', error)
        if (isMounted) setRouteData(null)
      }
    }

    if (token && selectedLevelIndoorId) {
      fetchRoute()
    }
    return () => {
      isMounted = false
    }
  }, [selectedLevelIndoorId, token])

  // Table cho Topology Options
  const TABLE_OPTIONS = [
    {
      value: 'grid-lines',
      label: 'Đồ thị đường đi (PreTopology)',
      color: GRID_LINE_COLOR,
    },
    {
      value: 'nodes',
      label: 'Đỉnh (Nodes)',
      color: '#dc2626',
    },
    {
      value: 'edges',
      label: 'Cạnh (Edges)',
      color: '#7c3aed',
    },
  ]

  const hasLevels = Boolean(levelIndoorIds?.features && levelIndoorIds.features.length > 0)
  const hasBuildings = Boolean(buildings?.features && buildings.features.length > 0)

  const handleAddIndoorClick = () => {
    if (!selectedLevelIndoorId) {
      message.warning(
        'Tòa nhà hiện tại chưa có Tầng (Level). Vui lòng cấu hình Tầng trước khi thêm đường đi!'
      )
      return
    }
    if (!routeData) {
      message.warning(
        'Tầng này chưa có Tuyến đường (Indoor Route). Vui lòng tạo Tuyến đường trước khi vẽ đường đi!'
      )
      return
    }
    setIsOpenAddIndoor(true)
  }

  return (
    <aside className="page-indoor-sidebar w-full shrink-0 space-y-2 sm:w-70 lg:w-72.5">
      {/* ================= PANEL 1: QUẢN LÝ ĐỊA ĐIỂM (GIỐNG INDOOR ADMIN) ================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="flex items-center gap-2 text-sm font-bold text-blue-700">
            <Map className="h-4 w-4" />
            Quản lý địa điểm
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-600">
            ADMIN
          </span>
        </div>

        <div className="space-y-3">
          {/* Chọn Venue */}
          <div>
            <label
              htmlFor="venueSelect"
              className="mb-1 flex items-center text-xs font-semibold text-blue-700"
            >
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              Chọn Venue:
            </label>
            <select
              id="venueSelect"
              value={selectedVenueId ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null
                setSelectedVenueId(val)
              }}
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
          <div>
            <label
              htmlFor="buildingSelect"
              className="mb-1 flex items-center text-xs font-semibold text-blue-700"
            >
              <Building2 className="mr-1 inline h-3.5 w-3.5" />
              Chọn Building:
            </label>
            <select
              id="buildingSelect"
              value={selectedBuildingId ?? ''}
              disabled={loadingBuildings || !hasBuildings}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null
                setSelectedBuildingId(val)
              }}
              className="h-11 w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400"
            >
              {loadingBuildings ? (
                <option value="">Đang tải danh sách tòa nhà...</option>
              ) : hasBuildings && buildings ? (
                buildings.features.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.properties.buildingName}
                  </option>
                ))
              ) : (
                <option value="">-- Chưa cấu hình Tòa nhà --</option>
              )}
            </select>
          </div>

          {/* Chọn Level */}
          <div>
            <label
              htmlFor="levelSelect"
              className="mb-1 flex items-center text-xs font-semibold text-blue-700"
            >
              <Compass className="mr-1 inline h-3.5 w-3.5" />
              Chọn Tầng (Level):
            </label>
            <select
              id="levelSelect"
              value={selectedLevelIndoorId ?? ''}
              disabled={loadingLevels || !hasLevels}
              onChange={(e) => {
                setSelectedLevelIndoorId(e.target.value || null)
              }}
              className="h-11 w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400"
            >
              {loadingLevels ? (
                <option value="">Đang tải danh sách tầng...</option>
              ) : hasLevels && levelIndoorIds ? (
                levelIndoorIds.features.map((level) => (
                  <option key={level.id} value={level.id}>
                    Tầng {level.properties.ordinal}
                  </option>
                ))
              ) : (
                <option value="">-- Tòa nhà chưa cấu hình Tầng --</option>
              )}
            </select>
          </div>

          {/* Tuyến đường liên kết */}
          <div className="text-xs text-gray-500 py-1 border-t border-slate-100">
            <span>Tuyến đường:</span>
            {!selectedBuildingId ? (
              <span className="ml-1.5 font-medium text-amber-600">Chưa chọn Tòa nhà</span>
            ) : !selectedLevelIndoorId ? (
              <span className="ml-1.5 font-medium text-amber-600">Tòa nhà chưa cấu hình Tầng</span>
            ) : routeData ? (
              <span className="ml-1.5 font-semibold text-sky-700">{routeData.indoorRouteName}</span>
            ) : (
              <span className="ml-1.5 font-medium text-rose-500">
                Chưa cài đặt tuyến đường hoặc không tìm thấy
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ================= PANEL 2: TOPOLOGY (ĐỒ THỊ ĐƯỜNG ĐI) ================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 text-sm font-bold text-blue-700">
          <span className="flex items-center gap-2">
            <Waypoints className="h-4 w-4" />
            Topology (Đồ thị đường đi)
          </span>
        </div>

        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={() => onReload?.()}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <button
            onClick={handleAddIndoorClick}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" /> Thêm đối tượng
          </button>
        </div>

        {/* Khung tabs Topology chuẩn hình 1 */}
        <ul
          role="listbox"
          aria-label="Danh sách đối tượng Topology"
          className="mt-2 ml-1 max-h-68 space-y-0.5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5"
        >
          {TABLE_OPTIONS.map((option) => {
            const isTabActive = selectedTableIndoor === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isTabActive}
                onClick={() => {
                  setSelectedTableIndoor(option.value)
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
      </section>
    </aside>
  )
}
