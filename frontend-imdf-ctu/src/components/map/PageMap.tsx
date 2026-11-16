import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, AlertTriangle, GraduationCap, Loader2, Sparkles } from 'lucide-react'

import { FLOORS_LEVEL_ID } from '../../context/NavigateContext'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useNavigateContext } from '../../context/NavigateContext'
import FloorSelector from './FloorSelector'
import CustomModal from './CustomModal'
import ModalLocation from './ModalLocation'
import ModalDirections from './ModalDirections'
import OutdoorRouteLayer from './OutdoorRouteLayer'
import IndoorRouteLayer from './IndoorRouteLayer'
import type { UnitGeoJsonItem } from '../../model/geoJsonEntity.model'
import { MAIN_ENTRANCE_COORDINATE, MAIN_ENTRANCE_HEX } from './OutdoorRoutingService'

const INDOOR_MIN_ZOOM = 18

const UNIT_LABEL_MIN_ZOOM = 20

const AVAILABLE_FLOORS = Object.keys(FLOORS_LEVEL_ID)

const UNIT_STYLE: L.PathOptions = {
  color: '#0059e8',
  weight: 1.2,
  opacity: 0.9,
  fillColor: '#d7e7ff',
  fillOpacity: 0.55,
  lineJoin: 'miter',
}

const UNIT_HOVER_STYLE: L.PathOptions = {
  color: '#199a22',
  weight: 1.8,
  fillColor: '#b6ffc3',
  fillOpacity: 0.7,
}

const createOnEachUnit =
  (onSelect: (unit: UnitGeoJsonItem) => void) => (feature: UnitGeoJsonItem, layer: L.Layer) => {
    const name = getUnitName(feature?.properties)

    if (name) {
      const label = document.createElement('span')
      label.textContent = name

      layer.bindTooltip(label, {
        permanent: true,
        direction: 'center',
        className: 'unit-label',
        interactive: false,
        opacity: 0.85,
      })
    }

    layer.on({
      mouseover: (e) => (e.target as L.Path).setStyle(UNIT_HOVER_STYLE),
      mouseout: (e) => (e.target as L.Path).setStyle(UNIT_STYLE),
      click: (e) => {
        L.DomEvent.stopPropagation(e)
        const props = feature?.properties ?? {}
        console.debug('PageMap: chọn unit', feature)
        onSelect({
          id: feature.id ?? (props as any).unit_id ?? (props as any).id,
          geometry: feature.geometry,
          properties: props,
          type: 'Feature',
        })
      },
    })
  }

const getUnitName = (properties: any): string => {
  const name = properties?.unit_name ?? properties?.unitName ?? properties?.name
  return typeof name === 'string' ? name.trim() : ''
}

const UNIT_LABEL_CSS = `
  .leaflet-tooltip.unit-label {
    background: transparent;
    border: 0;
    box-shadow: none;
    padding: 0;
    margin: 0;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: #4b5563;
    white-space: nowrap;
    pointer-events: none;
    text-shadow:
      0 0 2px rgba(255, 255, 255, 0.95),
      0 0 4px rgba(255, 255, 255, 0.8);
    transition: opacity 0.2s ease;
  }
  .leaflet-tooltip.unit-label::before {
    display: none;
  }
  .basemap[data-unit-labels='off'] .leaflet-tooltip.unit-label {
    opacity: 0 !important;
    visibility: hidden;
  }
`

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const createUserLocationIcon = () =>
  L.divIcon({
    className: 'google-user-location-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
        <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #1a73e8; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

const createDestinationPinIcon = (isRoom: boolean) =>
  L.divIcon({
    className: 'google-dest-pin-marker',
    html: `
      <div style="position: relative; width: 34px; height: 42px; display: flex; flex-direction: column; align-items: center;">
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));">
          <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 14.5 40.5 16.1 41.9C16.6 42.3 17.4 42.3 17.9 41.9C19.5 40.5 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${isRoom ? '#059669' : '#ea4335'}"/>
          <circle cx="17" cy="16" r="7" fill="#ffffff"/>
        </svg>
        <div style="position: absolute; top: 11px; width: 10px; height: 10px; display: flex; align-items: center; justify-content: center; color: ${isRoom ? '#059669' : '#ea4335'}; font-size: 8px; font-weight: bold;">
          ${isRoom ? '★' : '•'}
        </div>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
  })

const createMainEntranceIcon = () =>
  L.divIcon({
    className: 'main-entrance-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: 2px solid white; border-radius: 9999px; padding: 2px 8px; font-size: 11px; font-weight: bold; white-space: nowrap; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          <span style="font-size: 12px;">🚪</span>
          <span>Cổng chính</span>
        </div>
      </div>
    `,
    iconSize: [95, 26],
    iconAnchor: [47, 13],
  })

function MapZoomObserver({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap()

  useEffect(() => {
    const updateZoom = () => onZoomChange(map.getZoom())
    updateZoom()
    map.on('zoomend', updateZoom)
    return () => {
      map.off('zoomend', updateZoom)
    }
  }, [map, onZoomChange])

  return null
}

function FlyToDestination({
  position,
  isExternal,
}: {
  position: [number, number] | null
  isExternal: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (!position) return
    const zoom = isExternal
      ? Math.min(Math.max(map.getZoom(), 17), 19)
      : Math.max(map.getZoom(), UNIT_LABEL_MIN_ZOOM)
    map.flyTo(position, zoom, { animate: true, duration: 1.2 })
  }, [position, isExternal, map])

  return null
}

export default function PageMap() {
  const navigateCtx = useNavigateContext() as any
  const {
    buildingData,
    unitData,
    loadFloorData,
    loadedLevelId,
    isLoading,
    clearFloorData,
    failedLevelId,
    isLocationModalOpen,
    selectedDestination,
    setIsLocationModalOpen,
    searchItems,
    selectDestination,
    selectedFloor,
    setSelectedFloor,
    userLocation,
    isLocating,
    locate,
    routeData,
    indoorRouteData,
    isRouting,
    clearRoute,
  } = navigateCtx

  const [isCloseModal, setIsCloseModal] = useState(false)
  const [mapZoom, setMapZoom] = useState(16.5)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (selectedDestination) {
      setIsCloseModal(false)
      setIsLocationModalOpen(true)
    }
  }, [selectedDestination, routeData, indoorRouteData, setIsLocationModalOpen])

  useEffect(() => {
    if (indoorRouteData && !routeData && mapRef.current) {
      mapRef.current.setZoom(Math.max(mapRef.current.getZoom(), INDOOR_MIN_ZOOM), {
        animate: true,
      })
    }
  }, [indoorRouteData, routeData])

  const fitRoute = useCallback(() => {
    if (!mapRef.current) return
    const allCoords: [number, number][] = []
    if (routeData?.coordinates?.length) {
      allCoords.push(...routeData.coordinates)
    }
    if (indoorRouteData?.features?.length) {
      for (const f of indoorRouteData.features) {
        const coords = f.geometry?.coordinates as any
        if (!Array.isArray(coords)) continue
        if (f.geometry.type === 'MultiLineString') {
          for (const seg of coords) {
            for (const [lng, lat] of seg) allCoords.push([lat, lng])
          }
        } else {
          for (const [lng, lat] of coords) allCoords.push([lat, lng])
        }
      }
    }
    if (allCoords.length >= 2) {
      mapRef.current.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60], maxZoom: 19 })
    }
  }, [routeData, indoorRouteData])

  useEffect(fitRoute, [fitRoute])

  const handleLocate = async () => {
    const position = await locate()
    if (position) mapRef.current?.flyTo(position, 18, { duration: 1.2 })
  }

  const handleSwitchLevel = useCallback(
    (targetLevelId: number) => {
      const floorEntry = Object.entries(FLOORS_LEVEL_ID).find(([, id]) => id === targetLevelId)
      if (floorEntry && setSelectedFloor) {
        setSelectedFloor(floorEntry[0])
      }
      void loadFloorData(targetLevelId)
    },
    [loadFloorData, setSelectedFloor]
  )

  const isIndoorVisible = mapZoom >= INDOOR_MIN_ZOOM
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!isIndoorVisible) return

    const levelId = FLOORS_LEVEL_ID[selectedFloor ?? '']
    if (levelId === undefined) {
      clearFloorData()
      return
    }

    void loadFloorData(levelId)
  }, [selectedFloor, loadFloorData, clearFloorData, retryTick, isIndoorVisible])

  const units = unitData

  const isUnitsLoading = isIndoorVisible && isLoading
  const isUnitsFailed = isIndoorVisible && !isLoading && failedLevelId !== null

  const [selectedUnit, setSelectedUnit] = useState<UnitGeoJsonItem | null>(null)
  const handleCloseUnitModal = useCallback(() => setSelectedUnit(null), [])
  const handleEachUnit = useMemo(() => createOnEachUnit(setSelectedUnit), [setSelectedUnit])

  const destinationLatLng = useMemo<[number, number] | null>(() => {
    if (!selectedDestination) return null
    if (selectedDestination.coordinates) return selectedDestination.coordinates
    if (selectedDestination.geometry) {
      const bounds = L.geoJSON(selectedDestination.geometry as any).getBounds()
      if (bounds.isValid()) {
        const c = bounds.getCenter()
        return [c.lat, c.lng]
      }
    }
    return null
  }, [selectedDestination])

  const isDestOnOtherFloor =
    selectedDestination?.levelId !== undefined &&
    FLOORS_LEVEL_ID[selectedFloor ?? ''] !== selectedDestination.levelId

  const showDestMarker =
    !!selectedDestination &&
    !!destinationLatLng &&
    !isDestOnOtherFloor &&
    isLocationModalOpen &&
    !isCloseModal

  const initialCenter: [number, number] = [10.03031, 105.76843]

  const userIcon = useMemo(() => createUserLocationIcon(), [])
  const isRoomDest =
    selectedDestination?.category === 'unit' || selectedDestination?.category === 'anchor'
  const destIcon = useMemo(() => createDestinationPinIcon(isRoomDest), [isRoomDest])
  const entranceIcon = useMemo(() => createMainEntranceIcon(), [])

  const destMarkerRef = useRef<L.Marker | null>(null)
  useEffect(() => {
    if (showDestMarker) destMarkerRef.current?.openPopup()
  }, [destinationLatLng, showDestMarker])

  const handleQuickSearch = (keyword: string) => {
    const [first] = searchItems(keyword)
    if (first) selectDestination(first)
  }

  const quickTestChips = [
    { label: 'Phòng 101/DI', code: '101/DI' },
    { label: 'Khoa CNPM', code: 'CNPM/DI' },
    { label: 'Nhà vệ sinh WC1', name: 'WC1' },
  ]

  return (
    <div
      className="basemap relative h-full min-h-0 w-full rounded-2xl overflow-hidden border border-sky-500 shadow-lg"
      data-unit-labels={mapZoom >= UNIT_LABEL_MIN_ZOOM ? 'on' : 'off'}
    >
      <style>{UNIT_LABEL_CSS}</style>

      <MapContainer
        center={initialCenter}
        preferCanvas
        minZoom={1}
        zoom={16.5}
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
        maxZoom={22}
        ref={(map) => {
          if (map) mapRef.current = map
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={22}
        />
        <MapZoomObserver onZoomChange={setMapZoom} />
        <FlyToDestination
          position={destinationLatLng}
          isExternal={selectedDestination?.category === 'place'}
        />

        {/* 1. LỚP HIỂN THỊ CÁC PHÒNG HỌC (UNIT) */}
        {isIndoorVisible && units && (
          <GeoJSON
            key={`unit-${loadedLevelId}`}
            data={units}
            style={() => UNIT_STYLE}
            onEachFeature={handleEachUnit}
          />
        )}

        {/* 2. ĐƯỜNG ĐI NGOÀI TRỜI (OSRM) & ĐƯỜNG ĐI TRONG NHÀ (INDOOR + STAIR MARKER) */}
        <OutdoorRouteLayer route={routeData} />
        <IndoorRouteLayer
          route={indoorRouteData}
          activeLevelId={FLOORS_LEVEL_ID[selectedFloor ?? '']}
          onSwitchLevel={handleSwitchLevel}
        />

        {/* 3. VỊ TRÍ ĐỊNH VỊ CÁ NHÂN */}
        {userLocation && <Marker position={userLocation} icon={userIcon} />}

        {/* 4. MARKER ĐIỂM ĐẾN */}
        {showDestMarker && (
          <Marker ref={destMarkerRef} position={destinationLatLng!} icon={destIcon}>
            <Popup autoPan={false}>
              <div className="font-sans p-1">
                <strong className="text-slate-900 text-sm block">
                  {selectedDestination.title}
                </strong>
                {selectedDestination.subtitle && (
                  <p className="text-xs text-slate-600 mt-1">{selectedDestination.subtitle}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* 5. CỔNG VÀO CHÍNH */}
        <Marker position={MAIN_ENTRANCE_COORDINATE} icon={entranceIcon}>
          <Popup>
            <div className="font-sans p-1 text-center min-w-55">
              <strong className="text-amber-800 text-sm block font-bold">
                🚪 Cổng vào chính Khoa CNTT&TT
              </strong>
              <p className="text-xs text-slate-600 mt-1">
                Cổng vào chính ưu tiên của đường nội tuyến
              </p>
              <div className="mt-1.5 rounded bg-amber-50 border border-amber-200/80 p-1 font-mono text-[9px] text-amber-900 break-all select-all">
                {MAIN_ENTRANCE_HEX}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* THÔNG BÁO ĐANG TẢI SƠ ĐỒ TẦNG */}
      {isUnitsLoading && (
        <div
          role="status"
          aria-live="polite"
          className="absolute left-1/2 top-16 z-2000 flex -translate-x-1/2 items-center gap-2 rounded-full border border-sky-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-md"
        >
          <Loader2 size={16} className="animate-spin text-blue-600" />
          Đang tải sơ đồ tầng {selectedFloor}...
        </div>
      )}

      {/* THÔNG BÁO LỖI TẢI SƠ ĐỒ */}
      {isUnitsFailed && (
        <div
          role="alert"
          className="absolute left-1/2 top-16 z-2000 flex -translate-x-1/2 items-center gap-3 rounded-full border border-red-200 bg-red-50/95 px-4 py-2 text-sm text-red-700 shadow-lg"
        >
          <AlertTriangle size={16} />
          Không tải được sơ đồ tầng {selectedFloor}
          <button
            type="button"
            onClick={() => setRetryTick((t) => t + 1)}
            className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* QUICK FILTER CHIPS */}
      <div className="absolute top-4 left-4 z-1000 hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-[calc(100%-420px)] p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-md">
        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 px-2 py-1 uppercase tracking-wider shrink-0">
          <Sparkles size={12} className="text-amber-500" />
          <span>Gợi ý:</span>
        </span>
        {quickTestChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickSearch(chip.code ?? chip.name ?? chip.label)}
            className="flex items-center gap-1 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-700 transition cursor-pointer shrink-0"
          >
            {chip.code ? <GraduationCap size={13} className="text-emerald-600" /> : null}
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* NÚT ĐỊNH VỊ VỊ TRÍ CỦA TÔI */}
      <div className="absolute bottom-6 right-6 z-1000 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocate}
          disabled={isLocating}
          className="flex size-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-xl border border-slate-200 hover:bg-sky-50 hover:text-blue-600 active:scale-95 transition cursor-pointer"
          title="Định vị vị trí của tôi"
        >
          <Crosshair size={20} className={isLocating ? 'animate-spin text-blue-600' : ''} />
        </button>
      </div>

      {/* BỘ CHỌN TẦNG */}
      {isIndoorVisible && (
        <div className="absolute bottom-20 right-6 z-1000">
          <FloorSelector availableFloors={AVAILABLE_FLOORS} />
        </div>
      )}

      {/* MODAL THÔNG TIN ĐỊA ĐIỂM */}
      {selectedDestination && isLocationModalOpen && !isCloseModal && (
        <div className="absolute inset-x-2 bottom-2 z-1000 flex max-h-[60%] flex-col md:static md:inset-auto md:max-h-none">
          <ModalLocation
            setIsCloseModal={setIsCloseModal}
            routeData={routeData}
            isRouting={isRouting}
            onFitRoute={fitRoute}
            onClearRoute={clearRoute}
          />
        </div>
      )}

      {/* MODAL CHỌN ĐIỂM ĐI / ĐIỂM ĐẾN */}
      <ModalDirections />

      {/* MODAL CHI TIẾT UNIT */}
      {selectedUnit && (
        <CustomModal
          building={buildingData}
          selectedUnit={selectedUnit}
          isOpen
          onClose={handleCloseUnitModal}
          variant="unit"
        />
      )}
    </div>
  )
}
