import { useEffect, useRef, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Feature, Geometry } from 'geojson'
import type {
  DrawingGeometryMode,
  IMDFFeatureItem,
  IMDFFeatureType,
  IMDFProperties,
} from '../../../model/IMDF.model'
import type { SnapResult } from '../../../utils/imdfSnapUtils'
import type { ActiveLayerConfig } from './PublishedLayersManager'
import IndoorDrawingToolbar from './IndoorDrawingToolbar'
import IndoorDrawCanvasLayer from './IndoorDrawCanvasLayer'
import GeoServerLayersRenderer from './GeoServerLayersRenderer'

// Khởi tạo icon leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Tọa độ trung tâm Khoa CNTT&TT Đại học Cần Thơ (khớp với Route Tab)
const CTU_POSITION: [number, number] = [10.03080, 105.76893]

interface IndoorEditorMapProps {
  features: IMDFFeatureItem[]
  selectedFeature: IMDFFeatureItem | null
  onSelectFeature: (item: IMDFFeatureItem) => void
  drawingMode: DrawingGeometryMode
  targetFeatureType: IMDFFeatureType
  snapEnabled: boolean
  snapTolerancePx: number
  coordinates: [number, number][]
  currentSnap: SnapResult | null
  areaSqm: number
  lengthMeters: number
  activePublishedLayers: Record<number, ActiveLayerConfig>
  selectedLevelId: number
  layerVisibility: Record<IMDFFeatureType, boolean>
  onStartDrawing: (mode: DrawingGeometryMode, featureType: IMDFFeatureType) => void
  onToggleSnap: () => void
  onUndo: () => void
  onFinish: () => void
  onCancel: () => void
  onAddCoordinate: (coord: [number, number]) => void
  onSnapChange: (snap: SnapResult | null) => void
  onMouseMovePosition: (pos: [number, number] | null) => void
}

// Controller camera tự động canh chỉnh theo features
function CameraAutoFitter({ features }: { features: IMDFFeatureItem[] }) {
  const map = useMap()
  const hasFitRef = useRef(false)

  useEffect(() => {
    if (features.length > 0 && !hasFitRef.current) {
      try {
        const bounds = L.latLngBounds([])
        features.forEach((f) => {
          if (!f.feature?.geometry) return
          const g = f.feature.geometry
          if (g.type === 'Point') {
            bounds.extend([g.coordinates[1], g.coordinates[0]])
          } else if (g.type === 'LineString') {
            ;(g.coordinates as [number, number][]).forEach((c) =>
              bounds.extend([c[1], c[0]])
            )
          } else if (g.type === 'Polygon') {
            ;(g.coordinates[0] as [number, number][]).forEach((c) =>
              bounds.extend([c[1], c[0]])
            )
          } else if (g.type === 'MultiPolygon') {
            ;(g.coordinates[0][0] as [number, number][]).forEach((c) =>
              bounds.extend([c[1], c[0]])
            )
          }
        })
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 })
          hasFitRef.current = true
        }
      } catch (ignored) {
      }
    }
  }, [features, map])

  return null
}

export default function IndoorEditorMap({
  features,
  selectedFeature,
  onSelectFeature,
  drawingMode,
  targetFeatureType,
  snapEnabled,
  snapTolerancePx,
  coordinates,
  currentSnap,
  areaSqm,
  lengthMeters,
  activePublishedLayers,
  selectedLevelId,
  layerVisibility,
  onStartDrawing,
  onToggleSnap,
  onUndo,
  onFinish,
  onCancel,
  onAddCoordinate,
  onSnapChange,
  onMouseMovePosition,
}: IndoorEditorMapProps) {
  // Trích xuất danh sách Feature thô để phục vụ Snapping
  const rawFeaturesToSnap = useMemo<Feature<Geometry, IMDFProperties>[]>(() => {
    return features.map((f) => f.feature)
  }, [features])

  // Lọc features theo tầng hiện tại và theo checkbox bật/tắt của từng loại layer
  const visibleFeatures = useMemo(() => {
    return features.filter((f) => {
      const lvl = f.feature?.properties?.level_id
      if (lvl !== undefined && lvl !== null && Number(lvl) !== selectedLevelId) {
        return false
      }
      const ft = f.feature?.properties?.feature_type as IMDFFeatureType
      if (ft && layerVisibility[ft] === false) {
        return false
      }
      return true
    })
  }, [features, selectedLevelId, layerVisibility])

  // Style cho các đối tượng hình học IMDF
  const getFeatureStyle = (f: Feature<Geometry, IMDFProperties>) => {
    const isSelected = selectedFeature?.feature?.properties?.id === f.properties?.id
    const ft = f.properties?.feature_type

    let strokeColor = '#2563eb'
    let fillColor = '#3b82f6'
    let weight = 2

    if (ft === 'building' || ft === 'footprint') {
      strokeColor = '#1e293b'
      fillColor = '#475569'
      weight = 3
    } else if (ft === 'opening' || ft === 'door') {
      strokeColor = '#f59e0b'
      fillColor = '#fbbf24'
      weight = 3.5
    } else if (ft === 'fixture') {
      strokeColor = '#7c3aed'
      fillColor = '#a78bfa'
      weight = 2
    } else if (ft === 'unit') {
      const category = f.properties?.category
      if (category === 'classroom') {
        strokeColor = '#1d4ed8'
        fillColor = '#60a5fa'
      } else if (category === 'lab') {
        strokeColor = '#6d28d9'
        fillColor = '#a78bfa'
      } else if (category === 'restroom') {
        strokeColor = '#059669'
        fillColor = '#6ee7b7'
      } else if (category === 'corridor') {
        strokeColor = '#64748b'
        fillColor = '#cbd5e1'
      }
    }

    if (isSelected) {
      return {
        color: '#e11d48',
        fillColor: '#fb7185',
        weight: 3.5,
        fillOpacity: 0.55,
      }
    }

    return {
      color: strokeColor,
      fillColor: fillColor,
      weight,
      fillOpacity: 0.35,
    }
  }

  return (
    <div className="indoor_map relative h-full w-full rounded-2xl overflow-hidden">
      {/* 1. ON-MAP TOOLBAR & HUD */}
      <IndoorDrawingToolbar
        drawingMode={drawingMode}
        targetFeatureType={targetFeatureType}
        snapEnabled={snapEnabled}
        vertexCount={coordinates.length}
        areaSqm={areaSqm}
        lengthMeters={lengthMeters}
        onStartDrawing={onStartDrawing}
        onToggleSnap={onToggleSnap}
        onUndo={onUndo}
        onFinish={onFinish}
        onCancel={onCancel}
      />

      {/* 2. MAP CONTAINER */}
      <MapContainer
        center={CTU_POSITION}
        zoom={18}
        minZoom={1}
        maxZoom={22}
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Bản đồ nền OpenStreetMap CHÍNH XÁC tương tự tab Route, không bao giờ hiện lỗi */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={22}
        />

        {/* Canh chỉnh camera */}
        <CameraAutoFitter features={features} />

        {/* 3. HIỂN THỊ CÁC LAYER ĐÃ PUBLISH LÊN GEOSERVER (WMS / WFS / MVT) */}
        <GeoServerLayersRenderer
          activeLayers={activePublishedLayers}
          selectedLevelId={selectedLevelId}
        />

        {/* 4. CANVAS VẼ VÀ BẮT DÍNH (SNAPPING) */}
        <IndoorDrawCanvasLayer
          drawingMode={drawingMode}
          snapEnabled={snapEnabled}
          snapTolerancePx={snapTolerancePx}
          coordinates={coordinates}
          featuresToSnap={rawFeaturesToSnap}
          currentSnap={currentSnap}
          onAddCoordinate={onAddCoordinate}
          onSnapChange={onSnapChange}
          onMouseMovePosition={onMouseMovePosition}
          onFinishDrawing={onFinish}
          onCancelDrawing={onCancel}
          onUndoCoordinate={onUndo}
        />

        {/* 5. HIỂN THỊ CÁC FEATURES NỘI TẠI CỦA LAYER ĐANG QUẢN LÝ */}
        {visibleFeatures.map((item) => {
          const f = item.feature
          if (!f || !f.geometry) return null

          const isSelected = selectedFeature?.feature?.properties?.id === f.properties?.id
          const featName = f.properties?.name || f.properties?.id || 'Đối tượng'

          return (
            <div key={`feat-${f.properties?.id}`}>
              <GeoJSON
                key={`geojson-${f.properties?.id}-${isSelected}`}
                data={f}
                style={() => getFeatureStyle(f)}
                eventHandlers={{
                  click: () => onSelectFeature(item),
                }}
              >
                <Tooltip direction="center" permanent={f.properties?.feature_type === 'unit'}>
                  <div className="text-center font-bold text-[11px] leading-tight text-slate-800 drop-shadow-xs">
                    <div>{featName}</div>
                    {f.properties?.alt_name && (
                      <div className="text-[9px] font-normal text-slate-500">
                        {f.properties.alt_name}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </GeoJSON>

              {/* Marker tâm hiển thị (Display Point) */}
              {f.properties?.display_point && (
                <CircleMarker
                  center={[f.properties.display_point[1], f.properties.display_point[0]]}
                  radius={4}
                  color="#16a34a"
                  fillColor="#ffffff"
                  fillOpacity={1}
                  weight={2}
                  eventHandlers={{
                    click: () => onSelectFeature(item),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]}>
                    <span className="text-[10px] font-semibold">Tâm hiển thị: {featName}</span>
                  </Tooltip>
                </CircleMarker>
              )}
            </div>
          )
        })}
      </MapContainer>
    </div>
  )
}
