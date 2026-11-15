import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Crosshair,
  AlertTriangle,
  GraduationCap,
  Loader2, // MỚI: icon quay cho thông báo "đang tải"
  Sparkles,
  X,
} from 'lucide-react'

import { FLOORS_LEVEL_ID } from '../../context/NavigateContext'

// Khởi tạo icon mặc định của Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useNavigateContext } from '../../context/NavigateContext'
import FloorSelector from './FloorSelector'
import CustomModal from './CustomModal'
import ModalLocation from './ModalLocation'
import ModalDirections from './ModalDirections'
import OutdoorRouteLayer from './OutdoorRouteLayer'
import type { UnitGeoJsonItem } from '../../model/geoJsonEntity.model'
import { MAIN_ENTRANCE_COORDINATE, MAIN_ENTRANCE_HEX } from './OutdoorRoutingService'

const INDOOR_MIN_ZOOM = 18

const UNIT_LABEL_MIN_ZOOM = 20

const AVAILABLE_FLOORS = Object.keys(FLOORS_LEVEL_ID)

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

const createOnEachUnit =
  (onSelect: (unit: UnitGeoJsonItem) => void) => (feature: UnitGeoJsonItem, layer: L.Layer) => {
    // Gắn nhãn tên phòng + hiệu ứng hover
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
      click: (e) => {
        L.DomEvent.stopPropagation(e)
        const props = feature?.properties ?? {}
        // Một số tầng không có feature.id => dự phòng bằng thuộc tính id trong properties
        console.debug('PageMap: chọn unit', feature) // log kiểm tra dữ liệu (có thể xoá)
        onSelect({
          id: feature.id ?? (props as any).unit_id ?? (props as any).id,
          geometry: feature.geometry,
          properties: props,
          type: 'Feature',
        })
      },
    })
  }

// Lấy tên phòng từ properties (ưu tiên unit_name, có dự phòng vài tên khác).
const getUnitName = (properties: any): string => {
  const name = properties?.unit_name ?? properties?.unitName ?? properties?.name
  return typeof name === 'string' ? name.trim() : ''
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
        @keyframes pulse-ring {          0% { transform: scale(0.6); opacity: 0.9; }
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

// Bay camera tới điểm đến khi người dùng chọn 1 kết quả tìm kiếm.
// - Địa điểm trong nhà: zoom tối thiểu UNIT_LABEL_MIN_ZOOM để thấy phòng và nhãn tên phòng.
// - Địa điểm bên ngoài (Bến Ninh Kiều...): zoom vừa phải (17-19) để còn thấy khu vực xung quanh.
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

    userLocation,
    isLocating,
    locate,
    routeData,
    isRouting,
    clearRoute,
  } = useNavigateContext()

  const [isCloseModal, setIsCloseModal] = useState(false)
  const [mapZoom, setMapZoom] = useState(16.5)
  const mapRef = useRef<L.Map | null>(null)

  // Mở lại modal khi có destination mới
  useEffect(() => {
    if (selectedDestination) {
      setIsCloseModal(false)
      setIsLocationModalOpen(true)
    }
    // routeData: tìm đường xong thì mở lại modal để xem khoảng cách / thời gian / hướng dẫn
  }, [selectedDestination, routeData, setIsLocationModalOpen])

  // Căn bản đồ vừa toàn bộ lộ trình (tự động khi có đường mới, hoặc bấm "Toàn cảnh lộ trình")
  const fitRoute = useCallback(() => {
    if (routeData) {
      mapRef.current?.fitBounds(routeData.coordinates, { padding: [60, 60], maxZoom: 18.5 })
    }
  }, [routeData])
  useEffect(fitRoute, [fitRoute])

  // Bấm nút định vị: lấy GPS rồi bay tới vị trí của người dùng
  const handleLocate = async () => {
    const position = await locate()
    if (position) mapRef.current?.flyTo(position, 18, { duration: 1.2 })
  }

  // Chỉ hiển thị lớp phòng học khi zoom đủ gần để thấy tòa nhà
  const isIndoorVisible = mapZoom >= INDOOR_MIN_ZOOM
  // Tăng số này để kích hoạt tải lại khi bấm "Thử lại"
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

  // Trạng thái hiển thị thông báo
  const isUnitsLoading = isIndoorVisible && isLoading
  const isUnitsFailed = isIndoorVisible && !isLoading && failedLevelId !== null

  // Xu ly viec chon unit
  const [selectedUnit, setSelectedUnit] = useState<UnitGeoJsonItem | null>(null)
  const handleCloseUnitModal = useCallback(() => setSelectedUnit(null), [])
  const handleEachUnit = useMemo(() => createOnEachUnit(setSelectedUnit), [setSelectedUnit])

  // Toa do diem den: uu tien coordinates, neu khong co thi lay geometry
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

  // Phòng/tiện ích trong nhà chỉ hiện ghim khi đang xem đúng tầng của nó
  const isDestOnOtherFloor =
    selectedDestination?.levelId !== undefined &&
    FLOORS_LEVEL_ID[selectedFloor ?? ''] !== selectedDestination.levelId

  const showDestMarker =
    !!selectedDestination &&
    !!destinationLatLng &&
    !isDestOnOtherFloor &&
    isLocationModalOpen &&
    !isCloseModal

  // Toạ độ tâm bản đồ ban đầu (Khu II ĐH Cần Thơ)
  const initialCenter: [number, number] = [10.03031, 105.76843]

  // Bay tới vị trí người dùng khi có định vị
  // Tự ẩn thông báo lỗi định vị sau 3 giây

  const userIcon = useMemo(() => createUserLocationIcon(), [])
  // Phòng (unit) / anchor => ghim xanh có ngôi sao; tiện ích và địa điểm bên ngoài => ghim đỏ
  const isRoomDest =
    selectedDestination?.category === 'unit' || selectedDestination?.category === 'anchor'
  const destIcon = useMemo(() => createDestinationPinIcon(isRoomDest), [isRoomDest])
  const entranceIcon = useMemo(() => createMainEntranceIcon(), [])

  // Tự mở popup của điểm đến mỗi khi chọn 1 kết quả tìm kiếm
  const destMarkerRef = useRef<L.Marker | null>(null)
  useEffect(() => {
    if (showDestMarker) destMarkerRef.current?.openPopup()
  }, [destinationLatLng, showDestMarker])

  // Tìm nhanh bằng các chip gợi ý: chọn kết quả đầu tiên khớp từ khoá
  const handleQuickSearch = (keyword: string) => {
    const [first] = searchItems(keyword)
    if (first) selectDestination(first)
  }

  // Quick chips để kiểm thử nhanh các phòng học và toà nhà
  const quickTestChips = [
    { label: 'Phòng 101/DI', code: '101/DI' },
    { label: 'Khoa CNPM', code: 'CNPM/DI' },
    { label: 'Nhà vệ sinh WC1', name: 'WC1' },
  ]

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
        <FlyToDestination
          position={destinationLatLng}
          isExternal={selectedDestination?.category === 'place'}
        />

        {/* 1. LỚP HIỂN THỊ CÁC PHÒNG HỌC (UNIT) */}
        {isIndoorVisible && units && (
          <GeoJSON
            key={`unit-${loadedLevelId}`}
            data={units}
            style={() => UNIT_STYLE} // tone xám kiểu bản vẽ
            onEachFeature={handleEachUnit} // gắn nhãn tên phòng + hover
          />
        )}

        {/* 2. ĐƯỜNG ĐI NGOÀI TRỜI (OSRM) */}
        <OutdoorRouteLayer route={routeData} />

        {/* 3. VỊ TRÍ ĐỊNH VỊ CÁ NHÂN (GOOGLE MAPS BLUE DOT WITH RADAR PULSE) */}
        {userLocation && <Marker position={userLocation} icon={userIcon} />}

        {/* 4. MARKER ĐIỂM ĐẾN (GOOGLE MAPS PIN) */}
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

        {/* 5. CỔNG VÀO CHÍNH (ĐIỂM VÀO ƯU TIÊN NỘI TUYẾN 0000000001405A71363E2F0AAE40240FC5A6800F3F) */}
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

        {/* 6. ĐOẠN ĐƯỜNG NỘI TUYẾN (INDOOR CORRIDOR PATH HIGHLIGHT) */}

        {/* CAMERA CONTROLLER */}
      </MapContainer>

      {/* THÔNG BÁO LỖI ĐỊNH VỊ */}

      {/* MỚI: THÔNG BÁO ĐANG TẢI SƠ ĐỒ TẦNG
          Hiện khi đã zoom đủ gần nhưng dữ liệu của tầng đang xem chưa về. */}
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

      {/* MỚI: THÔNG BÁO LỖI TẢI SƠ ĐỒ + NÚT THỬ LẠI */}
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
            onClick={() => handleQuickSearch(chip.code ?? chip.name ?? chip.label)}
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
          onClick={handleLocate}
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
          <FloorSelector availableFloors={AVAILABLE_FLOORS} />
        </div>
      )}

      {/* THANH TỔNG QUAN LỘ TRÌNH DƯỚI CÙNG (FLOATING ROUTE SUMMARY BAR) */}

      {/* MODAL THÔNG TIN ĐỊA ĐIỂM TÌM THẤY (phòng, tiện ích, địa điểm bên ngoài) */}
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

      {/* MODAL CHỌN ĐIỂM ĐI / ĐIỂM ĐẾN ĐỂ TÌM ĐƯỜNG */}
      <ModalDirections />

      {/* MODAL HIỂN THỊ CHI TIẾT ĐỊA ĐIỂM (THIẾT KẾ HIỆN CÓ ĐÃ ĐƯỢC NÂNG CẤP) */}
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
