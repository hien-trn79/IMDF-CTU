import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { GRID_LINE_COLOR } from './gridLineGeoJson'
import type {
  PreTopologyItem,
  PreTopologyResponse,
} from '../../model/route models/preTopology.model'

interface GridLineLayerProps {
  data: PreTopologyResponse // GeoJSON FeatureCollection
  selectedFeature: PreTopologyItem | null
  onSelectFeature: (item: PreTopologyItem) => void
  onOpenDetailModal: (item: PreTopologyItem) => void
  onClearSelection: () => void
}

const BASE_STYLE: L.PathOptions = { color: GRID_LINE_COLOR, weight: 3, opacity: 0.9 }
const ACTIVE_STYLE: L.PathOptions = { color: '#f59e0b', weight: 6, opacity: 1 }

// Vẽ các đường grid line lên map. Phải đặt BÊN TRONG <MapContainer>.
export default function GridLineLayer({
  data,
  selectedFeature,
  onSelectFeature,
  onOpenDetailModal,
  onClearSelection,
}: GridLineLayerProps) {
  const map = useMap()

  const items = data.features

  // Index feature -> layer Leaflet, dùng để tô sáng khi chọn từ bảng
  const layersRef = useRef<Map<number, L.Polyline>>(new Map())

  // Giữ callback mới nhất mà không làm effect vẽ layer chạy lại
  const onSelectRef = useRef(onSelectFeature)
  const onOpenDetailRef = useRef(onOpenDetailModal)
  const onClearRef = useRef(onClearSelection)

  useEffect(() => {
    onSelectRef.current = onSelectFeature
    onOpenDetailRef.current = onOpenDetailModal
    onClearRef.current = onClearSelection
  }, [onSelectFeature, onOpenDetailModal, onClearSelection])

  // 1) Vẽ layer + bắt sự kiện click
  useEffect(() => {
    if (data.features.length === 0) return

    const indexByFeature = new Map<unknown, number>(data.features.map((f, i) => [f, i]))
    const layers = layersRef.current
    layers.clear()

    const layer = L.geoJSON(data, {
      style: BASE_STYLE,
      onEachFeature: (feature, featureLayer) => {
        const index = indexByFeature.get(feature)
        if (index === undefined) return
        layers.set(index, featureLayer as L.Polyline)

        featureLayer.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e) // không để map click bỏ chọn ngay sau đó
          const item = items[index]
          if (item) onSelectRef.current(item)
        })
        featureLayer.on('dblclick', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e)
          const item = items[index]
          if (item) onOpenDetailRef.current(item)
        })
      },
    }).addTo(map)

    // Bấm vào vùng trống của bản đồ => bỏ chọn
    const handleMapClick = () => onClearRef.current()
    map.on('click', handleMapClick)

    return () => {
      map.off('click', handleMapClick)
      layer.remove()
      layers.clear()
    }
  }, [map, data, items])

  // 2) Tô sáng feature đang chọn (từ bảng hoặc từ click trên map)
  useEffect(() => {
    layersRef.current.forEach((l, index) => {
      const active = selectedFeature === items[index]
      l.setStyle(active ? ACTIVE_STYLE : BASE_STYLE)
      if (active) {
        l.bringToFront()
        const bounds = l.getBounds()
        // Chỉ dịch bản đồ khi đường nằm ngoài khung nhìn hiện tại
        if (bounds.isValid() && !map.getBounds().contains(bounds)) {
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 21 })
        }
      }
    })
  }, [map, data, items, selectedFeature])

  return null
}
