import { useEffect, useRef, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { calcPolylineLengthMeters, formatLength } from '../../utils/wkbUtils'

type Coordinate = [number, number]

export interface SnapDetail {
  latLng: L.LatLng
  snapType: 'node' | 'vertex' | 'edge' | 'none'
  label: string
}

interface DrawRouteLayerProps {
  active: boolean
  snapEnabled: boolean
  coordinates: Coordinate[]
  snapCoordinates: (point: L.LatLng) => SnapDetail
  onCoordinatesChange: (coordinates: Coordinate[]) => void
  onFinishDrawing?: () => void
}

export default function DrawRouteLayer({
  active,
  snapEnabled,
  coordinates,
  snapCoordinates,
  onCoordinatesChange,
  onFinishDrawing,
}: DrawRouteLayerProps) {
  const map = useMap()
  const lineRef = useRef<L.Polyline | null>(null)
  const rubberbandRef = useRef<L.Polyline | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const snapMarkerRef = useRef<L.CircleMarker | null>(null)
  const [currentMouseDetail, setCurrentMouseDetail] = useState<SnapDetail | null>(null)

  useMapEvents({
    mousemove(event) {
      if (!active) {
        if (currentMouseDetail) setCurrentMouseDetail(null)
        return
      }
      const snapDetail = snapEnabled ? snapCoordinates(event.latlng) : { latLng: event.latlng, snapType: 'none' as const, label: '' }
      setCurrentMouseDetail(snapDetail)

      // Cập nhật đường xem trước rubberband từ điểm vừa click tới chuột
      if (coordinates.length > 0) {
        const lastPt = coordinates[coordinates.length - 1]
        const pts: L.LatLngExpression[] = [
          [lastPt[1], lastPt[0]],
          [snapDetail.latLng.lat, snapDetail.latLng.lng],
        ]
        if (!rubberbandRef.current) {
          rubberbandRef.current = L.polyline(pts, {
            color: '#0284c7',
            weight: 3,
            dashArray: '6 6',
            opacity: 0.85,
          }).addTo(map)
        } else {
          rubberbandRef.current.setLatLngs(pts)
        }
      }
    },
    click(event) {
      if (!active) return
      const snapDetail = snapEnabled ? snapCoordinates(event.latlng) : { latLng: event.latlng, snapType: 'none' as const, label: '' }
      const newPoint: Coordinate = [snapDetail.latLng.lng, snapDetail.latLng.lat]
      
      // Không thêm nếu trùng với điểm cuối vừa vẽ
      if (coordinates.length > 0) {
        const last = coordinates[coordinates.length - 1]
        if (Math.abs(last[0] - newPoint[0]) < 1e-7 && Math.abs(last[1] - newPoint[1]) < 1e-7) {
          return
        }
      }
      onCoordinatesChange([...coordinates, newPoint])
    },
    dblclick() {
      if (!active) return
      if (onFinishDrawing) onFinishDrawing()
    },
  })

  // Hiển thị marker Hút điểm (QGIS style)
  useEffect(() => {
    if (!active || !currentMouseDetail || currentMouseDetail.snapType === 'none') {
      snapMarkerRef.current?.remove()
      snapMarkerRef.current = null
      return
    }

    const { latLng, snapType, label } = currentMouseDetail

    let color = '#10b981' // green for node
    if (snapType === 'vertex') color = '#f59e0b' // amber for vertex
    if (snapType === 'edge') color = '#3b82f6' // blue for edge

    if (!snapMarkerRef.current) {
      snapMarkerRef.current = L.circleMarker(latLng, {
        radius: 8,
        color: color,
        fillColor: '#ffffff',
        fillOpacity: 0.9,
        weight: 3,
      }).addTo(map)
    } else {
      snapMarkerRef.current.setLatLng(latLng)
      snapMarkerRef.current.setStyle({ color })
    }

    snapMarkerRef.current.unbindTooltip()
    snapMarkerRef.current.bindTooltip(
      `<div class="px-1.5 py-0.5 font-sans text-xs font-semibold text-slate-800 flex items-center gap-1">
        <span>${snapType === 'node' ? '🎯' : snapType === 'vertex' ? '⚡' : '📐'}</span>
        <span>${label}</span>
       </div>`,
      { permanent: true, direction: 'top', className: 'qgis-snap-tooltip', offset: [0, -8] }
    ).openTooltip()
  }, [active, currentMouseDetail, map])

  // Vẽ các điểm đã click & đường polyline chính
  useEffect(() => {
    if (!markersRef.current) markersRef.current = L.layerGroup().addTo(map)
    markersRef.current.clearLayers()
    lineRef.current?.remove()
    lineRef.current = null

    if (coordinates.length > 0) {
      const latLngs = coordinates.map(([lng, lat]) => [lat, lng] as L.LatLngExpression)
      lineRef.current = L.polyline(latLngs, {
        color: '#059669',
        weight: 4,
        dashArray: active ? '6 4' : undefined,
      }).addTo(map)

      coordinates.forEach(([lng, lat], index) => {
        const isFirst = index === 0
        const isLast = index === coordinates.length - 1

        L.circleMarker([lat, lng], {
          radius: isFirst || isLast ? 6 : 4,
          color: isFirst ? '#047857' : isLast ? '#2563eb' : '#059669',
          fillColor: isFirst ? '#a7f3d0' : isLast ? '#bfdbfe' : '#ffffff',
          fillOpacity: 1,
          weight: 2,
        })
          .bindTooltip(`Điểm ${index + 1}${isFirst ? ' (Gốc)' : isLast ? ' (Mới nhất)' : ''}`, { direction: 'top' })
          .addTo(markersRef.current!)
      })
    }

    if (!active) {
      rubberbandRef.current?.remove()
      rubberbandRef.current = null
      snapMarkerRef.current?.remove()
      snapMarkerRef.current = null
    }

    return () => {
      lineRef.current?.remove()
      lineRef.current = null
      rubberbandRef.current?.remove()
      rubberbandRef.current = null
      markersRef.current?.clearLayers()
      snapMarkerRef.current?.remove()
      snapMarkerRef.current = null
    }
  }, [active, coordinates, map])

  const currentLengthMeters = coordinates.length >= 2 ? calcPolylineLengthMeters(coordinates) : 0

  return (
    active && coordinates.length > 0 ? (
      <div className="leaflet-bottom leaflet-right !mb-12 !mr-4 pointer-events-none z-[1000]">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-3 border border-slate-700">
          <span className="font-medium">Độ dài: <strong className="text-emerald-400">{formatLength(currentLengthMeters)}</strong></span>
          <span className="text-slate-400">|</span>
          <span>{coordinates.length} điểm</span>
        </div>
      </div>
    ) : null
  )
}
