import { useEffect, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Feature, Geometry } from 'geojson'
import type { DrawingGeometryMode, IMDFProperties } from '../../../model/IMDF.model'
import { findSnapTarget, type SnapResult } from '../../../utils/imdfSnapUtils'

interface IndoorDrawCanvasLayerProps {
  drawingMode: DrawingGeometryMode
  snapEnabled: boolean
  snapTolerancePx: number
  coordinates: [number, number][]
  featuresToSnap: Feature<Geometry, IMDFProperties>[]
  currentSnap: SnapResult | null
  onAddCoordinate: (coord: [number, number]) => void
  onSnapChange: (snap: SnapResult | null) => void
  onMouseMovePosition: (pos: [number, number] | null) => void
  onFinishDrawing: () => void
  onCancelDrawing: () => void
  onUndoCoordinate: () => void
}

export default function IndoorDrawCanvasLayer({
  drawingMode,
  snapEnabled,
  snapTolerancePx,
  coordinates,
  featuresToSnap,
  currentSnap,
  onAddCoordinate,
  onSnapChange,
  onMouseMovePosition,
  onFinishDrawing,
  onCancelDrawing,
  onUndoCoordinate,
}: IndoorDrawCanvasLayerProps) {
  const map = useMap()
  const isDrawing = drawingMode !== 'none'

  const activePolylineRef = useRef<L.Polyline | null>(null)
  const activePolygonRef = useRef<L.Polygon | null>(null)
  const rubberbandRef = useRef<L.Polyline | null>(null)
  const vertexMarkersGroupRef = useRef<L.LayerGroup | null>(null)
  const snapMarkerRef = useRef<L.CircleMarker | null>(null)

  // Xử lý sự kiện bàn phím (Ctrl+Z, Escape, Enter)
  useEffect(() => {
    if (!isDrawing) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelDrawing()
      } else if (e.key === 'Enter') {
        onFinishDrawing()
      } else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onUndoCoordinate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawing, onCancelDrawing, onFinishDrawing, onUndoCoordinate])

  // Lắng nghe sự kiện bản đồ: mousemove, click, dblclick
  useMapEvents({
    mousemove(e) {
      if (!isDrawing) {
        if (currentSnap) onSnapChange(null)
        return
      }

      const snapResult = snapEnabled
        ? findSnapTarget(e.latlng, map, featuresToSnap, coordinates, snapTolerancePx)
        : {
            latLng: e.latlng,
            snapType: 'none' as const,
            label: '',
            distancePx: Infinity,
          }

      onSnapChange(snapResult)
      onMouseMovePosition([snapResult.latLng.lng, snapResult.latLng.lat])

      // Vẽ đường dẫn xem trước (Rubberband line)
      if (coordinates.length > 0 && drawingMode !== 'point') {
        const lastCoord = coordinates[coordinates.length - 1]
        const pts: L.LatLngExpression[] = [
          [lastCoord[1], lastCoord[0]],
          [snapResult.latLng.lat, snapResult.latLng.lng],
        ]

        if (!rubberbandRef.current) {
          rubberbandRef.current = L.polyline(pts, {
            color: '#2563eb',
            weight: 2,
            dashArray: '5, 5',
            opacity: 0.85,
          }).addTo(map)
        } else {
          rubberbandRef.current.setLatLngs(pts)
        }
      }
    },

    click(e) {
      if (!isDrawing) return

      const snapResult = snapEnabled
        ? findSnapTarget(e.latlng, map, featuresToSnap, coordinates, snapTolerancePx)
        : {
            latLng: e.latlng,
            snapType: 'none' as const,
            label: '',
            distancePx: Infinity,
          }

      const targetLngLat: [number, number] = [snapResult.latLng.lng, snapResult.latLng.lat]
      onAddCoordinate(targetLngLat)

      // Nếu là chế độ Point thì hoàn thành ngay khi click điểm đầu tiên
      if (drawingMode === 'point') {
        setTimeout(() => onFinishDrawing(), 50)
      }
    },

    dblclick() {
      if (!isDrawing) return
      onFinishDrawing()
    },
  })

  // Hiển thị marker Snapping trực quan (Vertex, Edge, Display Point)
  useEffect(() => {
    if (!isDrawing || !currentSnap || currentSnap.snapType === 'none') {
      snapMarkerRef.current?.remove()
      snapMarkerRef.current = null
      return
    }

    const { latLng, snapType, label } = currentSnap

    let strokeColor = '#f59e0b'
    let fillColor = '#fbbf24'
    let radius = 6

    if (snapType === 'vertex') {
      strokeColor = '#e11d48'
      fillColor = '#f43f5e'
      radius = 7
    } else if (snapType === 'edge') {
      strokeColor = '#0284c7'
      fillColor = '#38bdf8'
      radius = 5
    } else if (snapType === 'display_point') {
      strokeColor = '#16a34a'
      fillColor = '#4ade80'
      radius = 6
    }

    if (!snapMarkerRef.current) {
      snapMarkerRef.current = L.circleMarker(latLng, {
        radius,
        color: strokeColor,
        fillColor,
        fillOpacity: 0.9,
        weight: 3,
      }).addTo(map)
    } else {
      snapMarkerRef.current.setLatLng(latLng)
      snapMarkerRef.current.setStyle({
        color: strokeColor,
        fillColor,
        radius,
      })
    }

    snapMarkerRef.current.unbindTooltip()
    snapMarkerRef.current.bindTooltip(label || `Bắt dính: ${snapType}`, {
      permanent: true,
      direction: 'top',
      offset: [0, -10],
      className:
        'bg-slate-900/90 text-white font-semibold text-[11px] px-2 py-0.5 rounded shadow-lg border border-slate-700',
    })

    return () => {
      snapMarkerRef.current?.remove()
      snapMarkerRef.current = null
    }
  }, [currentSnap, isDrawing, map])

  // Vẽ hình học đang vẽ dở (Polyline / Polygon + Vertex Markers)
  useEffect(() => {
    if (!isDrawing || coordinates.length === 0) {
      activePolylineRef.current?.remove()
      activePolylineRef.current = null
      activePolygonRef.current?.remove()
      activePolygonRef.current = null
      rubberbandRef.current?.remove()
      rubberbandRef.current = null
      vertexMarkersGroupRef.current?.remove()
      vertexMarkersGroupRef.current = null
      return
    }

    const latLngs: L.LatLngExpression[] = coordinates.map((c) => [c[1], c[0]])

    // 1. Quản lý Line / Polygon
    if (drawingMode === 'linestring') {
      if (!activePolylineRef.current) {
        activePolylineRef.current = L.polyline(latLngs, {
          color: '#2563eb',
          weight: 3.5,
          opacity: 0.9,
        }).addTo(map)
      } else {
        activePolylineRef.current.setLatLngs(latLngs)
      }
    } else if (drawingMode === 'polygon' || drawingMode === 'multipolygon') {
      if (!activePolygonRef.current) {
        activePolygonRef.current = L.polygon(latLngs, {
          color: '#2563eb',
          weight: 2.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.25,
          dashArray: '3, 3',
        }).addTo(map)
      } else {
        activePolygonRef.current.setLatLngs(latLngs)
      }
    }

    // 2. Quản lý các đỉnh đã click (Vertex dots)
    if (!vertexMarkersGroupRef.current) {
      vertexMarkersGroupRef.current = L.layerGroup().addTo(map)
    } else {
      vertexMarkersGroupRef.current.clearLayers()
    }

    latLngs.forEach((latLng, idx) => {
      const isFirst = idx === 0
      const dot = L.circleMarker(latLng, {
        radius: isFirst ? 6 : 4.5,
        color: isFirst ? '#16a34a' : '#2563eb',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2.5,
      })

      if (isFirst && (drawingMode === 'polygon' || drawingMode === 'multipolygon')) {
        dot.bindTooltip('Bấm vào đây để đóng khối Polygon', {
          direction: 'top',
          offset: [0, -8],
          className:
            'bg-emerald-800 text-white font-medium text-[11px] px-2 py-0.5 rounded shadow',
        })
      }

      dot.addTo(vertexMarkersGroupRef.current!)
    })

    return () => {
      // Clean up on unmount
      rubberbandRef.current?.remove()
      rubberbandRef.current = null
    }
  }, [coordinates, drawingMode, isDrawing, map])

  // Xóa layers khi kết thúc vẽ
  useEffect(() => {
    if (!isDrawing) {
      activePolylineRef.current?.remove()
      activePolylineRef.current = null
      activePolygonRef.current?.remove()
      activePolygonRef.current = null
      rubberbandRef.current?.remove()
      rubberbandRef.current = null
      vertexMarkersGroupRef.current?.remove()
      vertexMarkersGroupRef.current = null
    }
  }, [isDrawing])

  return null
}
