import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import { LAYER_COLORS } from './outdoorTypes'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useLayer } from '../../context/LayerContext'
import type { LayerFetchState } from './outdoorTypes'
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
  onFeatureClick?: (feature: any) => void
}

export default function OutdoorMap({
  setObjectCount,
  selectedFeature,
  onFeatureClick,
}: OutdoorMapProps) {
  const position: [number, number] = [10.03031, 105.76843]

  const { selectedLayers, geoServerUrl } = useLayer()

  const [layerData, setLayerData] = useState<Record<string, LayerFetchState>>({})
  const abortControllers = useRef<Record<string, AbortController>>({})

  const [selectedBuilding, setSelectedBuilding] = useState<any>(null)
  const [isOpenModal, setIsOpenModal] = useState(false)

  useEffect(() => {
    const currentIds = new Set(selectedLayers.map((layer) => layer.id))

    // Huy fetch cua layer da bi bo tick
    Object.keys(abortControllers.current).forEach((id) => {
      if (!currentIds.has(id)) {
        abortControllers.current[id].abort()
        delete abortControllers.current[id]
      }
    })

    // Xoa du lieu cua layer da bi bo tick
    setLayerData((prev) => {
      const next: Record<string, LayerFetchState> = {}
      for (const id of Object.keys(prev)) {
        if (currentIds.has(id)) next[id] = prev[id]
      }
      return next
    })

    // Chi fetch nhung layer moi duoc tick
    selectedLayers.forEach((layer) => {
      if (abortControllers.current[layer.id]) return // da fetch / dang fetch roi

      const controller = new AbortController()
      abortControllers.current[layer.id] = controller

      setLayerData((prev) => ({
        ...prev,
        [layer.id]: { data: null, loading: true, error: null },
      }))

      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: layer.layerName,
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
      })

      fetch(`${geoServerUrl}/wfs?${params.toString()}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.json()
        })
        .then((data) => {
          setLayerData((prev) => ({
            ...prev,
            [layer.id]: { data, loading: false, error: null },
          }))
        })
        .catch((err) => {
          // Fetch bi huy chu dong -> khong coi la loi
          if (err?.name === 'AbortError') return
          console.error(`Loi fetch layer ${layer.layerName}:`, err)
          setLayerData((prev) => ({
            ...prev,
            [layer.id]: {
              data: null,
              loading: false,
              error: err?.message || 'Lỗi tải dữ liệu', // luon luu string
            },
          }))
        })
    })
  }, [selectedLayers, geoServerUrl])

  // Tinh toan so luong doi tuong tren ban do va cap nhat cho parent component
  useEffect(() => {
    const count = Object.values(layerData).reduce((total, layerState) => {
      const features = layerState.data?.features
      return total + (Array.isArray(features) ? features.length : 0)
    }, 0)

    setObjectCount(count)
  }, [layerData, setObjectCount])

  // Chi huy toan bo fetch khi component unmount
  useEffect(() => {
    return () => {
      Object.values(abortControllers.current).forEach((c) => c.abort())
      abortControllers.current = {}
    }
  }, [])

  const getLayerColor = (layerId: string) => {
    const index = selectedLayers.findIndex((layer) => layer.id === layerId)
    return LAYER_COLORS[index % LAYER_COLORS.length]
  }

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

  const anyLoading = Object.values(layerData).some((s) => s.loading)
  const anyError = Object.entries(layerData).filter(([, s]) => s.error)

  return (
    <div className="outdoor_map relative h-full w-full rounded-2xl overflow-hidden">
      {anyLoading && (
        <div className="absolute top-3 right-3 z-1000 bg-white/90 px-3 py-1.5 rounded-lg shadow text-sm text-blue-600">
          Đang tải dữ liệu lớp bản đồ...
        </div>
      )}

      {anyError.length > 0 && (
        <div className="absolute top-3 right-3 z-1000 bg-white/90 px-3 py-1.5 rounded-lg shadow text-sm text-red-600 max-w-xs">
          {anyError.map(([id, s]) => (
            <div key={id}>
              {selectedLayers.find((l) => l.id === id)?.layerName}: {String(s.error)}
            </div>
          ))}
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
        {selectedFeature?.feature && (
          <GeoJSON
            key={selectedFeature.feature.id || JSON.stringify(selectedFeature.feature.geometry)}
            data={selectedFeature.feature}
            style={() => ({
              color: '#ef4444', // Màu đường viền (Đỏ tươi)
              weight: 4, // Độ dầy đường viền
              opacity: 0.9,
              fillColor: '#f87171', // Màu nền bên trong
              fillOpacity: 0.55, // Độ mờ màu nền
            })}
            onEachFeature={(_feature, layer) => {
              // Click trực tiếp vào geometry trên bản đồ cũng xem được chi tiết
              layer.on({
                click: () => {
                  onFeatureClick?.(selectedFeature)
                },
              })
            }}
          />
        )}

        {selectedLayers.map((layer) => {
          const layerState = layerData[layer.id]
          if (!layerState?.data) return null

          const color = getLayerColor(layer.id)
          const style = getFeatureStyle(color)

          return (
            <GeoJSON
              key={layer.id}
              data={layerState.data}
              style={style}
              pointToLayer={pointToLayer(color)}
              onEachFeature={onEachFeature(style)}
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
