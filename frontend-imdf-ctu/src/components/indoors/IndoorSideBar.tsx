import {
  Building2,
  ListStart,
  Map,
  MapPin,
  Plus,
  RotateCcw,
  UploadCloud,
  Waypoints,
} from 'lucide-react'
import { GRID_LINE_COLOR } from './gridLineGeoJson'
import { useEffect, useState } from 'react'
import type { VenueGeoJson, BuildingGeoJson, LevelGeoJson } from '../../model/geoJsonEntity.model'
import { useLayerContext } from '../../context/LayerContext'
import type { RouteResponse } from '../../model/route models/preTopology.model'
import { useUser } from '../../context/UserContext'

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
  onOpenImportModal,
  onReload,
}: IndoorSideBarProps) {
  const [venues, setVenues] = useState<VenueGeoJson>()
  const [selectedVenueId, setSelectedVenueId] = useState<number>(2)

  const [buildings, setBuildings] = useState<BuildingGeoJson>()
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(1)

  const [levelIndoorIds, setLevelIndoorIds] = useState<LevelGeoJson>()

  const [routeData, setRouteData] = useState<RouteResponse | null>(null)

  const {
    selectedLevelIndoorId,
    setSelectedLevelIndoorId,
    selectedTableIndoor,
    setSelectedTableIndoor,
  } = useLayerContext()
  const { token } = useUser()

  // Fetch du lieu
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/buildings?venueId=${selectedVenueId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Add the token to the Authorization header
            },
          }
        )
        const data = await response.json()
        setBuildings(data)
      } catch (error) {
        console.error('Error fetching buildings:', error)
      }
    }

    const fetchLevels = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/levels?buildingId=${selectedBuildingId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Add the token to the Authorization header
            },
          }
        )
        const data = await response.json()
        setLevelIndoorIds(data)
      } catch (error) {
        console.error('Error fetching levels:', error)
      }
    }

    const fetchVenues = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/venues', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Add the token to the Authorization header
          },
        })

        if (response.ok) {
          const data = await response.json()
          setVenues(data)
        } else {
          console.error('Error fetching venues:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching venues:', error)
      }
    }

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/indoor-routes?levelId=${selectedLevelIndoorId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Add the token to the Authorization header
            },
          }
        )
        if (response.ok) {
          const data = await response.json()
          setRouteData(data[0])
        } else {
          console.error('Error fetching routes:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching routes:', error)
      }
    }

    fetchVenues()
    fetchBuildings()
    fetchLevels()
    fetchRoute()

    return () => {
      setVenues(undefined)
      setBuildings(undefined)
      setLevelIndoorIds(undefined)
      setRouteData(null)
    }
  }, [selectedBuildingId, selectedLevelIndoorId])

  useEffect(() => {
    const firstLevelId = levelIndoorIds?.features[0]?.id
    if (!firstLevelId) return
    if (
      !selectedLevelIndoorId ||
      !levelIndoorIds.features.some((level) => String(level.id) === selectedLevelIndoorId)
    ) {
      setSelectedLevelIndoorId(String(firstLevelId))
    }
  }, [levelIndoorIds, selectedLevelIndoorId, setSelectedLevelIndoorId])

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

  return (
    <aside className="page-ourdoor-sidebar w-full shrink-0 space-y-4 sm:w-70 lg:w-72.5">
      {/* Panel 1: Chon Khoa Ngoai ve Venue va danh sach Building thuoc Venue */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-300 pb-3 text-sm font-bold text-blue-700">
          <span className="flex items-center gap-2">
            <Map className="h-4 w-4 fill-slate-300 text-blue-700" />
            Quản lý địa điểm
          </span>
        </div>

        {venues && buildings && levelIndoorIds && (
          <div className="space-y-1.5 rounded-xl p-2">
            <div className="mb-3">
              <label
                htmlFor="venueSelect"
                className="flex items-center text-sm font-semibold text-blue-700"
              >
                <MapPin className="mr-1 inline h-4 w-4 " />
                Chọn Venue
              </label>
              <select
                id="venueSelect"
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(Number(e.target.value))}
                className="mt-1 bg-white px-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {venues.features.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.properties.venueName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label
                htmlFor="buildingSelect"
                className="flex items-center text-sm font-semibold text-blue-700"
              >
                <Building2 className="mr-1 inline h-4 w-4 " />
                Chọn Building
              </label>
              <select
                id="buildingSelect"
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
                className="mt-1 bg-white block py-2 px-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {buildings.features.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.properties.buildingName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label
                htmlFor="levelSelect"
                className="flex items-center text-sm font-semibold text-blue-700"
              >
                <ListStart className="mr-1 inline h-4 w-4 " />
                Chọn Level
              </label>
              <select
                id="levelSelect"
                value={selectedLevelIndoorId ?? String(levelIndoorIds.features[0].id)}
                onChange={(e) => {
                  setSelectedLevelIndoorId(e.target.value)
                }}
                className="mt-1 bg-white px-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {levelIndoorIds.features.map((level) => (
                  <option key={level.id} value={level.id}>
                    Tầng {level.properties.ordinal}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-sm text-gray-500 py-2">
              Tuyến đường:
              {routeData ? (
                <span className=" ml-2 font-semibold text-sky-700">
                  {routeData.indoorRouteName}
                </span>
              ) : (
                <span className="ml-2font-semibold text-gray-500">Không tìm thấy tuyến đường</span>
              )}
            </span>
          </div>
        )}
      </section>
      {/* Panel 2: Topology */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-300 pb-3 text-sm font-bold text-blue-700">
          <span className="flex items-center gap-2">
            <Waypoints className="h-4 w-4 fill-slate-300 text-blue-700" />
            Topology (Đồ thị đường đi)
          </span>
        </div>

        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={() => onReload?.()}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <button
            onClick={() => setIsOpenAddIndoor(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Thêm đối tượng
          </button>
        </div>

        {venues && buildings && levelIndoorIds ? (
          <ul
            role="listbox"
            aria-label="Danh sách tòa nhà"
            className="mt-2 ml-2 max-h-68 space-y-0.5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5"
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
        ) : (
          <div className="flex items-center justify-center h-20">
            <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
          </div>
        )}
      </section>
    </aside>
  )
}
