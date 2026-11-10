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
  Loader2, // MỚI: icon quay cho thông báo "đang tải"
  Navigation,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'

import ModalDirections from './ModalDirections'
import FloorSelector from './FloorSelector'
import IndoorFloorPathLayer from './IndoorFloorPathLayer'
import { useMapNavigation } from '../../context/MapNavigationContext'
import type { DestinationItem, RouteData } from '../../model/Navigation.model'
import {
  MAIN_ENTRANCE_POINT,
  MAIN_ENTRANCE_HEX,
  type MapLevel,
} from '../../services/mapNavigationService'

// Khởi tạo icon mặc định của Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { UnitGeoJson } from '../../model/geoJsonEntity.model'

const INDOOR_MIN_ZOOM = 18

const UNITS_API_URL = 'http://localhost:8081/api/units'
const UNIT_LABEL_MIN_ZOOM = 20

// Style mặc định của mỗi phòng: nền xám nhạt + nét viền xám đậm mảnh.
const UNIT_STYLE: L.PathOptions = {
  color: '#0059e8', // viền xám đá
  weight: 1.2, // nét mảnh như nét bút kỹ thuật
  opacity: 0.9,
  fillColor: '#d7e7ff', // nền xám giấy
  fillOpacity: 0.55,
  lineJoin: 'miter', // góc vuông sắc nét như bản vẽ
}

// Style khi rê chuột vào phòng: đậm hơn một chút để người dùng dễ nhận biết.
const UNIT_HOVER_STYLE: L.PathOptions = {
  color: '#199a22',
  weight: 1.8,
  fillColor: '#b6ffc3',
  fillOpacity: 0.7,
}

// Lấy tên phòng từ properties (ưu tiên unit_name, có dự phòng vài tên khác).
const getUnitName = (properties: any): string => {
  const name = properties?.unit_name ?? properties?.unitName ?? properties?.name
  return typeof name === 'string' ? name.trim() : ''
}

// Chạy cho từng phòng khi vẽ GeoJSON: gắn nhãn tên + hiệu ứng hover.
const onEachUnit = (feature: any, layer: L.Layer) => {
  const name = getUnitName(feature?.properties)

  if (name) {
    // Dùng textContent (không dùng chuỗi HTML) để tên phòng không bị chèn mã độc.
    const label = document.createElement('span')
    label.textContent = name

    // Tooltip "permanent" luôn hiển thị, đặt ở tâm hình đa giác.
    layer.bindTooltip(label, {
      permanent: true,
      direction: 'center',
      className: 'unit-label', // style nằm ở UNIT_LABEL_CSS bên dưới
      interactive: false, // không chặn chuột => vẫn hover/click được phòng
      opacity: 0.85,
    })
  }

  // Hover: đổi style phòng, rời chuột: trả về style mặc định.
  layer.on({
    mouseover: (e) => (e.target as L.Path).setStyle(UNIT_HOVER_STYLE),
    mouseout: (e) => (e.target as L.Path).setStyle(UNIT_STYLE),
  })
}

// CSS cho nhãn tên phòng: chữ nhỏ, xám nhạt, không nền, không viền, có quầng
// trắng rất mảnh quanh chữ để vẫn đọc được trên nền xám.
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
  /* Bỏ mũi tên mặc định của tooltip */
  .leaflet-tooltip.unit-label::before {
    display: none;
  }
  /* Zoom chưa đủ gần => ẩn toàn bộ nhãn (cần !important vì Leaflet gán opacity inline) */
  .basemap[data-unit-labels='off'] .leaflet-tooltip.unit-label {
    opacity: 0 !important;
    visibility: hidden;
  }
`

// Sắp xếp tầng: 'G' (tầng trệt) luôn đứng đầu, các tầng còn lại theo số.
const sortFloors = (a: string, b: string) => {
  if (a === 'G') return -1
  if (b === 'G') return 1
  return Number(a) - Number(b)
}

// Chuẩn hoá tên tầng của một địa điểm: '0' hoặc rỗng => 'G'.
const floorOf = (loc: { level?: string | null }) => (loc.level === '0' ? 'G' : loc.level || 'G')

// Đọc levelId từ rawProperties của địa điểm (hỗ trợ cả camelCase lẫn snake_case).
const readLevelId = (loc: any): number | null => {
  const raw = loc?.rawProperties?.levelId ?? loc?.rawProperties?.level_id
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

// Cache dữ liệu units theo levelId để không tải lại khi quay lại tầng cũ. Dữ liệu này
const unitsCache = new Map<number, UnitGeoJson>()
const unitsInflight = new Map<number, Promise<UnitGeoJson>>()

const loadUnits = (levelId: number): Promise<UnitGeoJson> => {
  // 1. Đã có trong cache => trả về ngay, không gọi mạng.
  const cached = unitsCache.get(levelId)
  if (cached) return Promise.resolve(cached)

  // 2. Đang có request cùng levelId => dùng lại request đó.
  const inflight = unitsInflight.get(levelId)
  if (inflight) return inflight

  // 3. Chưa có => tạo request mới.
  const params = new URLSearchParams({
    page: '0',
    size: '200',
    sort: 'id,ASC',
    levelId: String(levelId),
  })

  const promise = fetch(`${UNITS_API_URL}?${params}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<UnitGeoJson>
    })
    .then((data) => {
      unitsCache.set(levelId, data) // lưu cache khi thành công
      return data
    })
    // Dù thành công hay lỗi đều xoá khỏi danh sách "đang chạy"
    // => nếu lỗi thì lần gọi sau (nút "Thử lại") sẽ tạo request mới.
    .finally(() => unitsInflight.delete(levelId))

  unitsInflight.set(levelId, promise)
  return promise
}

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
    const cameraCoordinates = routeData?.indoorGeoJsonFeatures?.length
      ? routeData.coordinates
      : routeData?.indoorPathSegments?.length
        ? (routeData.outdoorCoordinates ?? [])
        : (routeData?.coordinates ?? [])
    if (cameraCoordinates.length >= 2) {
      const bounds = L.latLngBounds(cameraCoordinates.map(([lat, lng]) => [lat, lng]))
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

// Quan sát sự thay đổi zoom của bản đồ và gọi callback
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
    setSelectedFloor,
  } = useMapNavigation()

  const [isCloseModal, setIsCloseModal] = useState(false)
  const [mapZoom, setMapZoom] = useState(16.5)
  const [mapLevels, setMapLevels] = useState<MapLevel[]>([])
  const mapRef = useRef<L.Map | null>(null)

  // Mở lại modal khi có destination mới
  useEffect(() => {
    if (selectedDestination) {
      setIsCloseModal(false)
      setShowLocationModal(true)
    }
  }, [selectedDestination, setShowLocationModal])

  // Danh sách các tầng có dữ liệu (từ API hoặc suy ra từ danh sách phòng)
  const availableFloors = useMemo(() => {
    const floors = new Set<string>()
    mapLevels.forEach((level) => floors.add(level.ordinal === 0 ? 'G' : String(level.ordinal)))
    // Nếu chưa có dữ liệu level từ API thì suy ra tầng từ danh sách phòng
    if (mapLevels.length === 0) {
      allLocations
        .filter((loc) => loc.category === 'room' && loc.geometry)
        .forEach((loc) => floors.add(floorOf(loc)))
    }
    return Array.from(floors).sort(sortFloors)
  }, [allLocations, mapLevels])

  const totalFloors = useMemo(() => {
    return availableFloors.length > 0 ? availableFloors : ['G']
  }, [availableFloors])

  // Nếu tầng đang chọn không còn tồn tại thì chuyển về tầng đầu tiên
  useEffect(() => {
    if (!totalFloors.includes(selectedFloor)) setSelectedFloor(totalFloors[0] ?? 'G')
  }, [selectedFloor, setSelectedFloor, totalFloors])

  // Ánh xạ từng tầng thành levelId
  const levelIdByFloor = useMemo(() => {
    const map: Record<string, number> = {}

    // Ưu tiên dữ liệu level lấy từ API (nếu có)
    mapLevels.forEach((level) => {
      const id = Number(level.id)
      if (Number.isInteger(id) && id > 0) {
        map[level.ordinal === 0 ? 'G' : String(level.ordinal)] = id
      }
    })

    // Bổ sung từ danh sách phòng cho những tầng còn thiếu
    for (const loc of allLocations) {
      if (loc.category !== 'room') continue
      const floor = floorOf(loc)
      if (map[floor] !== undefined) continue
      const id = readLevelId(loc)
      if (id !== null) map[floor] = id
    }
    return map
  }, [allLocations, mapLevels])

  // levelId của tầng đang xem (null nếu chưa xác định được)
  const selectedLevelId = levelIdByFloor[selectedFloor] ?? null

  // Chỉ hiển thị lớp phòng học khi zoom đủ gần để thấy tòa nhà
  const isIndoorVisible = mapZoom >= INDOOR_MIN_ZOOM
  const [unitsByLevel, setUnitsByLevel] = useState<Record<number, UnitGeoJson>>({})
  const [failedLevels, setFailedLevels] = useState<Set<number>>(new Set())
  // Tăng số này để kích hoạt tải lại khi bấm "Thử lại"
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    let active = true // tránh setState sau khi effect đã bị huỷ

    // Đưa tầng đang xem lên đầu danh sách
    const ids = Object.values(levelIdByFloor).sort((a, b) =>
      a === selectedLevelId ? -1 : b === selectedLevelId ? 1 : 0
    )

    ids.forEach((id) => {
      loadUnits(id)
        .then((data) => {
          if (!active) return
          // Chỉ setState nếu level này chưa có, tránh render thừa
          setUnitsByLevel((prev) => (prev[id] ? prev : { ...prev, [id]: data }))
          // Tải thành công => bỏ đánh dấu lỗi (nếu từng lỗi)
          setFailedLevels((prev) => {
            if (!prev.has(id)) return prev
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        })
        .catch((error) => {
          console.error(`Không tải được units của level ${id}:`, error)
          if (active) setFailedLevels((prev) => new Set(prev).add(id))
        })
    })

    return () => {
      active = false
    }
  }, [levelIdByFloor, selectedLevelId, retryTick])

  // Dữ liệu units của tầng đang xem (đọc từ cache nên đổi tầng là tức thì)
  const units = selectedLevelId !== null ? (unitsByLevel[selectedLevelId] ?? null) : null

  // Trạng thái hiển thị thông báo
  const isUnitsLoading =
    isIndoorVisible && selectedLevelId !== null && !units && !failedLevels.has(selectedLevelId)
  const isUnitsFailed =
    isIndoorVisible && selectedLevelId !== null && !units && failedLevels.has(selectedLevelId)

  const selectedOrdinal = selectedFloor === 'G' ? 0 : Number(selectedFloor)

  // Toạ độ tâm bản đồ ban đầu (Khu II ĐH Cần Thơ)
  const initialCenter: [number, number] = [10.03031, 105.76843]

  // Handler căn giữa lại toàn cảnh lộ trình
  // const handleFitRoute = () => {
  //   if (!mapRef.current) return
  //   const routeCoordinates = routeData?.indoorGeoJsonFeatures?.length
  //     ? routeData.coordinates
  //     : routeData?.indoorPathSegments?.length
  //     ? routeData.outdoorCoordinates ?? []
  //     : routeData?.coordinates ?? []
  //   if (routeCoordinates.length >= 2) {
  //     const bounds = L.latLngBounds(routeCoordinates.map(([lat, lng]) => [lat, lng]))
  //     mapRef.current.fitBounds(bounds, {
  //       padding: [60, 60],
  //       maxZoom: 18.5,
  //       animate: true,
  //     })
  //   } else if (selectedDestination) {
  //     mapRef.current.flyTo(selectedDestination.coordinates, 18, { animate: true })
  //   }
  // }

  // Handler định vị cá nhân
  const handleRecenterUser = () => {
    refreshUserLocation()
  }

  // Bay tới vị trí người dùng khi có định vị
  useEffect(() => {
    if (showUserLocation && userLocation && mapRef.current) {
      mapRef.current.flyTo(userLocation, 18, { animate: true })
    }
  }, [showUserLocation, userLocation])

  // Tự ẩn thông báo lỗi định vị sau 3 giây
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
    { label: 'Phòng 101/DI', code: '101/DI' },
    { label: 'Phòng 210/DI', code: '210/DI' },
    { label: 'Khoa CNPM', code: 'CNPM/DI' },
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
    <div
      className="basemap relative h-full min-h-0 w-full rounded-2xl overflow-hidden border border-sky-500 shadow-lg"
      // CSS dựa vào thuộc tính này để ẩn/hiện nhãn tên phòng theo mức zoom
      data-unit-labels={mapZoom >= UNIT_LABEL_MIN_ZOOM ? 'on' : 'off'}
    >
      {/* CSS cho nhãn tên phòng (xem UNIT_LABEL_CSS) */}
      <style>{UNIT_LABEL_CSS}</style>

      {/* Dùng preferCanvas để vẽ vector bằng Canvas thay vì SVG */}
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

        {/* 1. LỚP HIỂN THỊ CÁC PHÒNG HỌC (UNIT) */}
        {isIndoorVisible && units && (
          <GeoJSON
            key={`units-${selectedFloor}-${selectedLevelId}`}
            data={units}
            style={() => UNIT_STYLE} // tone xám kiểu bản vẽ
            onEachFeature={onEachUnit} // gắn nhãn tên phòng + hover
          />
        )}

        {/* 2. ĐƯỜNG ĐI CHỈ DẪN GOOGLE MAPS STYLE (RÕ NÉT, TRỰC QUAN & ĐẸP) */}
        {routeData &&
          !routeData.indoorPathSegments?.length &&
          !routeData.indoorGeoJsonFeatures?.length &&
          routeData.coordinates.length >= 2 && (
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
        {routeData?.indoorGeoJsonFeatures?.map((feature, index) => {
          const positions = feature.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
          )
          return (
            <span key={`indoor-geojson-route-${feature.id ?? index}`}>
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#0f172a',
                  weight: 12,
                  opacity: 0.16,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#ffffff',
                  weight: 9,
                  opacity: 0.98,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#0ea5e9',
                  weight: 5.5,
                  opacity: 1,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#bae6fd',
                  weight: 2,
                  opacity: 0.9,
                  dashArray: '5 12',
                  lineCap: 'round',
                }}
              />
            </span>
          )
        })}
        {routeData?.indoorPathSegments?.length &&
          routeData.outdoorCoordinates &&
          routeData.outdoorCoordinates.length >= 2 && (
            <Polyline
              positions={routeData.outdoorCoordinates}
              pathOptions={{
                color: '#1a73e8',
                weight: 5.5,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
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
                <p className="text-xs text-slate-600 mt-1">{selectedDestination.address}</p>
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
        {routeData?.indoorCoordinates &&
          routeData.indoorCoordinates.length >= 2 &&
          !routeData.indoorPathSegments?.length &&
          !routeData.indoorGeoJsonFeatures?.length && (
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
        {routeData?.indoorPathSegments && routeData.indoorPathSegments.length > 0 && (
          <IndoorFloorPathLayer
            segments={routeData.indoorPathSegments}
            currentOrdinal={Number.isFinite(selectedOrdinal) ? selectedOrdinal : 0}
          />
        )}

        {/* CAMERA CONTROLLER */}
        <RouteMapCameraController routeData={routeData} selectedDestination={selectedDestination} />
      </MapContainer>

      {/* THÔNG BÁO LỖI ĐỊNH VỊ */}
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

      {/* MỚI: THÔNG BÁO ĐANG TẢI SƠ ĐỒ TẦNG
          Hiện khi đã zoom đủ gần nhưng dữ liệu của tầng đang xem chưa về. */}
      {isUnitsLoading && (
        <div
          role="status"
          aria-live="polite"
          className="absolute left-1/2 top-16 z-[2000] flex -translate-x-1/2 items-center gap-2 rounded-full border border-sky-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-md"
        >
          <Loader2 size={16} className="animate-spin text-blue-600" />
          Đang tải sơ đồ tầng {selectedFloor}...
        </div>
      )}

      {/* MỚI: THÔNG BÁO LỖI TẢI SƠ ĐỒ + NÚT THỬ LẠI */}
      {isUnitsFailed && (
        <div
          role="alert"
          className="absolute left-1/2 top-16 z-[2000] flex -translate-x-1/2 items-center gap-3 rounded-full border border-red-200 bg-red-50/95 px-4 py-2 text-sm text-red-700 shadow-lg"
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

      {/* BỘ CHỌN TẦNG (chỉ hiện khi zoom đủ gần) */}
      {isIndoorVisible && (
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
              onClick={() =>
                console.log('PageMap: Thực hiện chức năng thể hiện đường đi toàn cảnh.')
              }
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
      {showDirectionsModal && <ModalDirections />}
    </div>
  )
}
