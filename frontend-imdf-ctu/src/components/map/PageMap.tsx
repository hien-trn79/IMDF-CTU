import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  Circle,
  GeoJSON,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Crosshair,
  AlertTriangle,
  GraduationCap,
  Navigation,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'

import ModalLocation from './ModalLocation'
import ModalDirections from './ModalDirections'
import FloorSelector from './FloorSelector'
import { useMapNavigation } from '../../context/MapNavigationContext'
import type { DestinationItem, RouteData } from '../../model/Navigation.model'
import {
  MAIN_ENTRANCE_POINT,
  MAIN_ENTRANCE_HEX,
} from '../../services/mapNavigationService'

// Khởi tạo icon mặc định của Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// 1. Tạo Google Maps Style User Location Icon (Pulsing Blue Dot)
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

// 2. Tạo Google Maps Style Destination Pin (Red Teardrop Pin)
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

// 3. Tạo Icon Cổng Vào Chính toà nhà Khoa CNTT&TT (0000000001405A71363E2F0AAE40240FC5A6800F3F)
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

// Component điều khiển camera và fitBounds
function RouteMapCameraController({
  routeData,
  selectedDestination,
}: {
  routeData: RouteData | null
  selectedDestination: DestinationItem | null
}) {
  const map = useMap()

  // Tự động fitBounds khi có lộ trình mới
  useEffect(() => {
    if (routeData && routeData.coordinates.length >= 2) {
      const bounds = L.latLngBounds(
        routeData.coordinates.map(([lat, lng]) => [lat, lng])
      )
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 18.5,
        animate: true,
      })
    } else if (selectedDestination) {
      // Nếu chỉ chọn điểm đến mà chưa vẽ đường, bay đến điểm đến
      map.flyTo(selectedDestination.coordinates, 18, {
        animate: true,
        duration: 1.2,
      })
    }
  }, [routeData, selectedDestination, map])

  return null
}

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

export default function PageMap() {
  const {
    userLocation,
    setUserLocation,
    refreshUserLocation,
    isLocating,
    showUserLocation,
    locationError,
    clearLocationError,
    selectedDestination,
    selectDestinationAndRoute,
    routeData,
    clearRoute,
    showLocationModal,
    setShowLocationModal,
    showDirectionsModal,
    allLocations,
    selectedFloor,
  } = useMapNavigation()

  const [isCloseModal, setIsCloseModal] = useState(false)
  const [mapZoom, setMapZoom] = useState(16.5)
  const mapRef = useRef<L.Map | null>(null)

  // Mở lại modal khi có destination mới
  useEffect(() => {
    if (selectedDestination) {
      setIsCloseModal(false)
      setShowLocationModal(true)
    }
  }, [selectedDestination, setShowLocationModal])

  // Lọc ra các phòng học có polygon để vẽ lên bản đồ
  const availableFloors = useMemo(() => {
    const floors = allLocations
      .filter((loc) => loc.category === 'room' && loc.geometry)
      .map((loc) => (loc.level === '0' ? 'G' : loc.level || 'G'))
    return Array.from(new Set(floors))
  }, [allLocations])

  const totalFloors = useMemo(() => {
    const floors = new Set(['G', ...availableFloors])
    return Array.from(floors).sort((a, b) => {
      if (a === 'G') return -1
      if (b === 'G') return 1
      return Number(a) - Number(b)
    })
  }, [availableFloors])

  const roomUnits = useMemo(() => {
    if (mapZoom < 18.5) return []
    return allLocations.filter((loc) => {
      const floor = loc.level === '0' ? 'G' : loc.level || 'G'
      return loc.category === 'room' && loc.geometry && floor === selectedFloor
    })
  }, [allLocations, mapZoom, selectedFloor])

  // Toạ độ tâm bản đồ ban đầu (Khu II ĐH Cần Thơ)
  const initialCenter: [number, number] = [10.03031, 105.76843]

  // Handler căn giữa lại toàn cảnh lộ trình
  const handleFitRoute = () => {
    if (!mapRef.current) return
    if (routeData && routeData.coordinates.length >= 2) {
      const bounds = L.latLngBounds(
        routeData.coordinates.map(([lat, lng]) => [lat, lng])
      )
      mapRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 18.5,
        animate: true,
      })
    } else if (selectedDestination) {
      mapRef.current.flyTo(selectedDestination.coordinates, 18, { animate: true })
    }
  }

  // Handler định vị cá nhân
  const handleRecenterUser = () => {
    refreshUserLocation()
  }

  useEffect(() => {
    if (showUserLocation && userLocation && mapRef.current) {
      mapRef.current.flyTo(userLocation, 18, { animate: true })
    }
  }, [showUserLocation, userLocation])

  useEffect(() => {
    if (!locationError) return
    const timer = window.setTimeout(clearLocationError, 3000)
    return () => window.clearTimeout(timer)
  }, [locationError, clearLocationError])

  const userIcon = useMemo(() => createUserLocationIcon(), [])
  const isRoomDest = selectedDestination?.category === 'room'
  const destIcon = useMemo(() => createDestinationPinIcon(isRoomDest), [isRoomDest])
  const entranceIcon = useMemo(() => createMainEntranceIcon(), [])

  // Quick chips để kiểm thử nhanh các phòng học và toà nhà
  const quickTestChips = [
    { label: 'Phòng DI/101', code: 'DI/101' },
    { label: 'Phòng DI/102', code: 'DI/102' },
    { label: 'Phòng DI/105', code: 'DI/105' },
    { label: 'Khoa HTTT', code: 'DI/HTTT' },
    { label: 'Trường Kinh tế', name: 'Trường Kinh tế' },
    { label: 'Nhà vệ sinh WC1', name: 'WC1' },
  ]

  const handleChipClick = (chip: { label: string; code?: string; name?: string }) => {
    const target = allLocations.find((loc) => {
      if (chip.code && loc.roomCode === chip.code) return true
      if (chip.name && loc.title.toLowerCase().includes(chip.name.toLowerCase())) return true
      return false
    })
    if (target) {
      selectDestinationAndRoute(target)
    }
  }

  return (
    <div className="basemap relative h-full min-h-0 w-full rounded-2xl overflow-hidden border border-sky-500 shadow-lg">
      {/* MAP CONTAINER */}
      <MapContainer
        center={initialCenter}
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

        {/* 1. LỚP HIỂN THỊ CÁC PHÒNG HỌC (UNIT) TRONG KHOA CNTT&TT */}
        {roomUnits.map((room) => {
          const isSelected = selectedDestination?.id === room.id
          return (
            <GeoJSON
              key={room.id}
              data={room.geometry}
              style={() => ({
                color: isSelected ? '#059669' : '#0284c7',
                weight: isSelected ? 3 : 1.5,
                fillColor: isSelected ? '#10b981' : '#bae6fd',
                fillOpacity: isSelected ? 0.6 : 0.3,
                dashArray: isSelected ? undefined : '3 3',
              })}
              onEachFeature={(_feature, layer) => {
                layer.bindTooltip(
                  `<div class="font-sans text-xs font-bold text-slate-800">
                    <span>${room.title}</span>
                    ${room.roomCode ? `<div class="text-[10px] text-emerald-700">Mã: ${room.roomCode}</div>` : ''}
                   </div>`,
                  { direction: 'center', permanent: false }
                )
                layer.on('click', () => {
                  selectDestinationAndRoute(room)
                })
              }}
            />
          )
        })}

        {/* 2. ĐƯỜNG ĐI CHỈ DẪN GOOGLE MAPS STYLE (RÕ NÉT, TRỰC QUAN & ĐẸP) */}
        {routeData && routeData.coordinates.length >= 2 && (
          <>
            {/* Lớp bóng mờ ngoài (Elevation shadow) */}
            <Polyline
              positions={routeData.coordinates}
              pathOptions={{
                color: '#0f172a',
                weight: 10,
                opacity: 0.15,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />

            {/* Lớp viền trắng tương phản cao (Google Maps route casing) */}
            <Polyline
              positions={routeData.coordinates}
              pathOptions={{
                color: '#ffffff',
                weight: 8.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />

            {/* Lớp đường đi màu xanh Google Maps chính (Google Maps Core Blue) */}
            <Polyline
              positions={routeData.coordinates}
              pathOptions={{
                color: '#1a73e8',
                weight: 5.5,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />

            {/* Lớp chấm accent phản quang nổi bật (Inner pulse dots) */}
            <Polyline
              positions={routeData.coordinates}
              pathOptions={{
                color: '#93c5fd',
                weight: 2,
                dashArray: '6, 12',
                opacity: 0.85,
                lineCap: 'round',
              }}
            />
          </>
        )}

        {/* 3. VỊ TRÍ ĐỊNH VỊ CÁ NHÂN (GOOGLE MAPS BLUE DOT WITH RADAR PULSE) */}
        {showUserLocation && userLocation && (
          <>
            {/* Vòng tròn bán kính định vị mờ */}
            <Circle
              center={userLocation}
              radius={25}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#60a5fa',
                fillOpacity: 0.15,
                weight: 1,
              }}
            />

            {/* Marker vị trí người dùng (Có thể kéo thả để thử nghiệm các vị trí khác nhau) */}
            <Marker
              position={userLocation}
              icon={userIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target
                  const pos = marker.getLatLng()
                  setUserLocation([pos.lat, pos.lng])
                },
              }}
            >
              <Popup>
                <div className="text-center font-sans p-1">
                  <strong className="text-blue-700 text-sm">Vị trí của bạn</strong>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Định vị cá nhân (Khu II ĐH Cần Thơ)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    (Bạn có thể kéo marker này để thử vị trí khác)
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* 4. MARKER ĐIỂM ĐẾN (GOOGLE MAPS PIN) */}
        {selectedDestination && (
          <Marker position={selectedDestination.coordinates} icon={destIcon}>
            <Popup>
              <div className="font-sans p-1">
                <strong className="text-slate-900 text-sm block">
                  {selectedDestination.title}
                </strong>
                {selectedDestination.roomCode && (
                  <span className="inline-block mt-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    Mã phòng: {selectedDestination.roomCode}
                  </span>
                )}
                <p className="text-xs text-slate-600 mt-1">
                  {selectedDestination.address}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 5. CỔNG VÀO CHÍNH (ĐIỂM VÀO ƯU TIÊN NỘI TUYẾN 0000000001405A71363E2F0AAE40240FC5A6800F3F) */}
        <Marker position={MAIN_ENTRANCE_POINT} icon={entranceIcon}>
          <Popup>
            <div className="font-sans p-1 text-center min-w-[220px]">
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

        {/* 6. ĐOẠN ĐƯỜNG NỘI TUYẾN (INDOOR CORRIDOR PATH HIGHLIGHT) */}
        {routeData?.indoorCoordinates && routeData.indoorCoordinates.length >= 2 && (
          <Polyline
            positions={routeData.indoorCoordinates}
            pathOptions={{
              color: '#10b981',
              weight: 4,
              dashArray: '6, 8',
              opacity: 1,
              lineCap: 'round',
            }}
          />
        )}

        {/* CAMERA CONTROLLER */}
        <RouteMapCameraController
          routeData={routeData}
          selectedDestination={selectedDestination}
        />
      </MapContainer>

      {locationError && (
        <div
          role="alert"
          className="absolute left-1/2 top-4 z-[2500] flex w-[min(92%,480px)] -translate-x-1/2 items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-amber-900 shadow-xl backdrop-blur-md"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Cần bật quyền định vị</p>
            <p className="mt-0.5 text-xs leading-relaxed">{locationError}</p>
          </div>
          <button
            type="button"
            onClick={clearLocationError}
            className="ml-auto shrink-0 rounded-full p-1 text-amber-700 transition hover:bg-amber-100"
            aria-label="Đóng thông báo định vị"
            title="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* QUICK FILTER CHIPS (TÌM NHANH PHÒNG HỌC & ĐỊA ĐIỂM) */}
      <div className="absolute top-4 left-4 z-1000 hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-[calc(100%-420px)] p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-md">
        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 px-2 py-1 uppercase tracking-wider shrink-0">
          <Sparkles size={12} className="text-amber-500" />
          <span>Gợi ý:</span>
        </span>
        {quickTestChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="flex items-center gap-1 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-700 transition cursor-pointer shrink-0"
          >
            {chip.code ? <GraduationCap size={13} className="text-emerald-600" /> : null}
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* NÚT ĐỊNH VỊ VỊ TRÍ CỦA TÔI (GPS FAB BUTTON) */}
      <div className="absolute bottom-6 right-6 z-1000 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRecenterUser}
          disabled={isLocating}
          className="flex size-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-xl border border-slate-200 hover:bg-sky-50 hover:text-blue-600 active:scale-95 transition cursor-pointer"
          title="Định vị vị trí của tôi"
        >
          <Crosshair size={20} className={isLocating ? 'animate-spin text-blue-600' : ''} />
        </button>
      </div>

      {mapZoom >= 18.5 && (
        <div className="absolute bottom-20 right-6 z-1000">
          <FloorSelector availableFloors={availableFloors} totalFloors={totalFloors} />
        </div>
      )}

      {/* THANH TỔNG QUAN LỘ TRÌNH DƯỚI CÙNG (FLOATING ROUTE SUMMARY BAR) */}
      {routeData && (
        <div className="absolute bottom-6 left-6 z-1000 hidden md:flex items-center gap-4 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Navigation size={20} className="fill-current" />
          </div>

          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                Đến: {routeData.destination.title}
              </span>
              {routeData.destination.roomCode && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {routeData.destination.roomCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
              <span className="font-semibold text-blue-600">{routeData.distanceText}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-600">{routeData.durationText}</span>
              <span>•</span>
              <span>Chỉ đường đi bộ Google Maps</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 shrink-0">
            <button
              type="button"
              onClick={handleFitRoute}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Toàn cảnh
            </button>
            <button
              type="button"
              onClick={clearRoute}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
              title="Xoá đường đi"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL HIỂN THỊ CHI TIẾT ĐỊA ĐIỂM (THIẾT KẾ HIỆN CÓ ĐÃ ĐƯỢC NÂNG CẤP) */}
      {(showLocationModal || selectedDestination) && !isCloseModal && (
        <ModalLocation
          setIsCloseModal={setIsCloseModal}
          onFitRoute={handleFitRoute}
        />
      )}
      {showDirectionsModal && <ModalDirections />}
    </div>
  )
}
