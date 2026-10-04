import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import { useEffect, useRef, useState } from 'react'
import { useLayer } from '../../context/LayerContext'
import CustomModal from '../map/CustomModal'
// import { networkNodeService } from '../../services/networkNodeService'
// import { networkEdgeService } from '../../services/networkEdgeService'
// import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
// import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Mỗi layer được fetch riêng, lưu theo id để render độc lập
interface LayerFetchState {
  data: any | null
  loading: boolean
  error: string | null
}

const LAYER_COLORS = ['#2563eb', '#f97316', '#16a34a', '#dc2626', '#9333ea', '#0891b2', '#ca8a04']

export default function BaseMap() {
  const { selectedLayers, geoServerUrl } = useLayer()

  // Dữ liệu GeoJSON theo từng layer, key = layer.id
  const [layerData, setLayerData] = useState<Record<string, LayerFetchState>>({})
  const abortControllers = useRef<Record<string, AbortController>>({})

  // Chon tòa nhà để hiển thị modal
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null)
  const [isOpenModal, setIsOpenModal] = useState(false)
  // const [networkNodes, setNetworkNodes] = useState<NetworkNodeResponse[]>([])
  // const [networkEdges, setNetworkEdges] = useState<NetworkEdgeResponse[]>([])
  // const [networkLoading, setNetworkLoading] = useState(true)
  // const [networkError, setNetworkError] = useState<string | null>(null)
  // const [networkVisible, setNetworkVisible] = useState(true)
  // const [selectedNode, setSelectedNode] = useState<NetworkNodeResponse | null>(null)
  // const [selectedEdge, setSelectedEdge] = useState<NetworkEdgeResponse | null>(null)

  // Toa do ban dau cua ban do
  const position: [number, number] = [10.03031, 105.76843]

  // useEffect(() => {
  //   let cancelled = false
  //   setNetworkLoading(true)
  //   setNetworkError(null)

  //   Promise.all([networkNodeService.getAll(), networkEdgeService.getAll()])
  //     .then(([nodes, edges]) => {
  //       if (cancelled) return
  //       setNetworkNodes(nodes)
  //       setNetworkEdges(edges)
  //     })
  //     .catch((error: unknown) => {
  //       if (!cancelled) {
  //         setNetworkError(error instanceof Error ? error.message : 'Không thể tải mạng lưới indoor')
  //       }
  //     })
  //     .finally(() => {
  //       if (!cancelled) setNetworkLoading(false)
  //     })

  //   return () => {
  //     cancelled = true
  //   }
  // }, [])

  useEffect(() => {
    const currentIds = new Set(selectedLayers.map((l) => l.id))

    // Huỷ fetch và xoá dữ liệu của layer đã bị bỏ chọn
    Object.keys(abortControllers.current).forEach((id) => {
      if (!currentIds.has(id)) {
        abortControllers.current[id].abort()
        delete abortControllers.current[id]
      }
    })
    setLayerData((prev) => {
      const next: Record<string, LayerFetchState> = {}
      for (const id of Object.keys(prev)) {
        if (currentIds.has(id)) next[id] = prev[id]
      }
      return next
    })

    // Fetch những layer mới được chọn (chưa có trong abortControllers)
    selectedLayers.forEach((layer) => {
      if (abortControllers.current[layer.id]) return // đã fetch/đang fetch rồi

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

      // Fetch dữ liệu GeoJSON từ GeoServer
      // duong link vi du: http://localhost:8080/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=building&outputFormat=application/json&srsName=EPSG:4326
      fetch(`${geoServerUrl}/wfs?${params.toString()}`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data) => {
          setLayerData((prev) => ({
            ...prev,
            [layer.id]: { data, loading: false, error: null },
          }))
        })
        .catch((err) => {
          if (err.name === 'AbortError') return
          console.error(`Lỗi fetch layer ${layer.layerName}:`, err)
          setLayerData((prev) => ({
            ...prev,
            [layer.id]: { data: null, loading: false, error: err.message || 'Lỗi tải dữ liệu' },
          }))
        })
    })

    // Cleanup khi unmount
    return () => {
      if (selectedLayers.length === 0) {
        Object.values(abortControllers.current).forEach((c) => c.abort())
        abortControllers.current = {}
      }
    }
  }, [selectedLayers, geoServerUrl])

  // Lấy màu cho từng layer dựa trên index trong selectedLayers
  const getColorForLayer = (id: string) => {
    const index = selectedLayers.findIndex((l) => l.id === id)
    return LAYER_COLORS[index % LAYER_COLORS.length]
  }

  // Hàm trả về style cho từng feature dựa trên loại hình học
  const getFeatureStyle = (color: string) => (feature: any) => {
    const geomType = feature?.geometry?.type
    if (geomType === 'LineString' || geomType === 'MultiLineString') {
      return { color, weight: 3, dashArray: '4 4' }
    }
    return { color, weight: 2, fillColor: color, fillOpacity: 0.4 }
  }

  const pointToLayer = (color: string) => (_feature: any, latlng: L.LatLng) => {
    return L.circleMarker(latlng, {
      radius: 6,
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.8,
    })
  }

  // Hàm xử lý từng feature, thêm sự kiện click để mở modal và hover để đổi style
  const onEachFeature = (originalStyle: any) => (feature: any, layer: any) => {
    if (feature.properties && feature.properties.name) {
      layer.on({
        click: () => {
          setSelectedBuilding(feature)
          setIsOpenModal(true)
        },
        mouseover: (e: any) => {
          const l = e.target
          if (l.setStyle) {
            l.setStyle({ weight: 4, fillOpacity: 0.7 })
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

  // Kiểm tra xem có layer nào đang loading hay có lỗi không
  const anyLoading = Object.values(layerData).some((s) => s.loading)
  const errors = Object.entries(layerData).filter(([, s]) => s.error)

  return (
    <div className="basemap relative h-full w-full rounded-2xl overflow-hidden border border-sky-500">
      {anyLoading && (
        <div className="absolute top-3 right-3 z-1000 bg-white/90 px-3 py-1.5 rounded-lg shadow text-sm text-blue-600">
          Đang tải dữ liệu lớp bản đồ...
        </div>
      )}

      {errors.length > 0 && (
        <div className="absolute top-3 right-3 z-1000 bg-white/90 px-3 py-1.5 rounded-lg shadow text-sm text-red-600 max-w-xs">
          {errors.map(([id, s]) => (
            <div key={id}>
              {selectedLayers.find((l) => l.id === id)?.layerName}: {s.error}
            </div>
          ))}
        </div>
      )}

      <MapContainer
        center={position}
        minZoom={1}
        zoom={16.5}
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
        maxZoom={22}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={22}
        />

        {/* Render mỗi layer đã chọn thành 1 GeoJSON riêng, mỗi layer 1 màu */}
        {selectedLayers.map((layer) => {
          const state = layerData[layer.id]
          if (!state?.data) return null

          const color = getColorForLayer(layer.id)
          const style = getFeatureStyle(color)

          return (
            <GeoJSON
              key={layer.id}
              data={state.data}
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
      </MapContainer>
    </div>
  )
}
