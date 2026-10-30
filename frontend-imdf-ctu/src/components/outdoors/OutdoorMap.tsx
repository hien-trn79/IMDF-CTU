import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import { LAYER_COLORS } from './outdoorTypes'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import CustomModal from '../map/CustomModal'
import MapController from '../map/MapController'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface OutdoorMapProps {
  setObjectCount: (count: number) => void
  selectedFeature: any // Feature được chọn từ bảng OutdoorTable
  features: any[]
  isLoading?: boolean
  onFeatureClick?: (feature: any) => void
}

export default function OutdoorMap({
  setObjectCount,
  selectedFeature,
  features,
  isLoading = false,
  onFeatureClick,
}: OutdoorMapProps) {
  const position: [number, number] = [10.03031, 105.76843]

  const [selectedBuilding, setSelectedBuilding] = useState<any>(null)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const layerData = features
  useEffect(() => {
    setObjectCount(features.length)
  }, [features, setObjectCount])

  const getFeatureStyle = (color: string) => (feature: any) => {
    const geometryType = feature?.geometry?.type
    if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
      return { color, weight: 3, dashArray: '4 4' }
    }
    return { color, weight: 2, fillColor: color, fillOpacity: 0.5 }
  }

  const pointToLayer = (color: string) => (_feature: any, latlng: L.LatLngExpression) => {
    return L.circleMarker(latlng, {
      radius: 6,
      color,
      fillColor: color,
      weight: 2,
      fillOpacity: 0.8,
    })
  }

  // originalStyle la ham (feature) => style
  const onEachFeature = (originalStyle: (f: any) => any) => (feature: any, layer: any) => {
    if (feature.properties && feature.properties.name) {
      layer.on({
        click: () => {
          setSelectedBuilding(feature)
          setIsOpenModal(true)
        },
        mouseover: (e: any) => {
          const l = e.target
          if (l.setStyle) {
            l.setStyle({ ...originalStyle(feature), weight: 4, color: '#ff0000' })
          }
        },
        mouseout: (e: any) => {
          const l = e.target
          if (l.setStyle) {
            l.setStyle(originalStyle(feature))
          }
        },
      })
    }
  }

  const anyLoading = isLoading

  return (
    <div className="outdoor_map relative h-full w-full rounded-2xl overflow-hidden">
      {anyLoading && (
        <div className="absolute top-3 right-3 z-1000 bg-white/90 px-3 py-1.5 rounded-lg shadow text-sm text-blue-600">
          Đang tải dữ liệu lớp bản đồ...
        </div>
      )}


      <MapContainer
        center={position}
        minZoom={1}
        zoom={16.5}
        maxZoom={22}
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={22}
        />

        {/* DOI MAU GEOMETRY DUOC CHON TU TABLE ROW */}
        {/* ĐỔI MÀU (HIGHLIGHT) GEOMETRY ĐƯỢC CHỌN */}
        {layerData.map(({ feature, layer }: any, index: number) => {
          const isSelected =
            selectedFeature?.feature?.id != null &&
            String(selectedFeature.feature.id) === String(feature.id)
          const color = isSelected
            ? '#f97316'
            : layer.layerName === 'unit'
              ? '#0f766e'
              : LAYER_COLORS[index % LAYER_COLORS.length]
          const style = isSelected
            ? () => ({
                color: '#f97316',
                weight: 4,
                opacity: 0.9,
                fillColor: '#fb923c',
                fillOpacity: 0.55,
              })
            : getFeatureStyle(color)

          return (
            <GeoJSON
              key={`${layer.id}-${feature.id ?? index}`}
              data={feature}
              style={style}
              pointToLayer={pointToLayer(color)}
              onEachFeature={(item, leafletLayer) => {
                onEachFeature(style)(item, leafletLayer)
                leafletLayer.on({ click: () => onFeatureClick?.({ feature: item, layer, index }) })
              }}
            />
          )
        })}

        {selectedBuilding && isOpenModal && (
          <CustomModal
            building={selectedBuilding}
            isOpen={isOpenModal}
            onClose={() => setIsOpenModal(false)}
          />
        )}

        {/* Thêm MapController vào bên trong MapContainer */}
        <MapController selectedFeature={selectedFeature} />
      </MapContainer>
    </div>
  )
}
