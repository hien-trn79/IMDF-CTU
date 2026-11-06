import { useEffect, useRef, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { calcPolylineLengthMeters, formatLength } from '../../utils/wkbUtils'
import { findSnapTarget } from '../../utils/imdfSnapUtils'
import type { Feature, Geometry } from 'geojson'

interface IndoorDrawingLayerProps {
  drawing: boolean
  snapEnabled: boolean
  coordinates: [number, number][]
  features: Feature<Geometry, Record<string, unknown>>[]
  onCoordinatesChange: (coordinates: [number, number][]) => void
}

export default function IndoorDrawingLayer({
  drawing,
  snapEnabled,
  coordinates,
  features,
  onCoordinatesChange,
}: IndoorDrawingLayerProps) {
  const map = useMap()
  const lineRef = useRef<L.Polyline | null>(null)
  const previewRef = useRef<L.Polyline | null>(null)
  const markerGroupRef = useRef<L.LayerGroup | null>(null)
  const snapRef = useRef<L.CircleMarker | null>(null)
  const [cursor, setCursor] = useState<L.LatLng | null>(null)

  const snap = (latLng: L.LatLng) =>
    snapEnabled ? findSnapTarget(latLng, map, features as never[]).latLng : latLng

  useMapEvents({
    mousemove(event) {
      if (!drawing) return
      const point = snap(event.latlng)
      setCursor(point)
      if (coordinates.length > 0) {
        const last = coordinates[coordinates.length - 1]
        previewRef.current?.setLatLngs([
          [last[1], last[0]],
          [point.lat, point.lng],
        ])
      }
    },
    click(event) {
      if (!drawing) return
      const point = snap(event.latlng)
      const next: [number, number] = [point.lng, point.lat]
      const last = coordinates[coordinates.length - 1]
      if (last && last[0] === next[0] && last[1] === next[1]) return
      onCoordinatesChange([...coordinates, next])
    },
  })

  useEffect(() => {
    markerGroupRef.current ??= L.layerGroup().addTo(map)
    lineRef.current?.remove()
    markerGroupRef.current.clearLayers()

    if (coordinates.length > 0) {
      const latLngs = coordinates.map(([lng, lat]) => [lat, lng] as L.LatLngExpression)
      lineRef.current = L.polyline(latLngs, {
        color: '#059669',
        weight: 4,
        opacity: 0.95,
        dashArray: drawing ? '6 4' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)
      coordinates.forEach(([lng, lat], index) =>
        L.circleMarker([lat, lng], {
          radius: 5,
          color: '#047857',
          fillColor: '#d1fae5',
          fillOpacity: 1,
          weight: 2,
        })
          .bindTooltip(`Điểm ${index + 1}`)
          .addTo(markerGroupRef.current!)
      )
    }

    if (drawing && coordinates.length > 0 && !previewRef.current) {
      previewRef.current = L.polyline([], {
        color: '#2563eb',
        weight: 3,
        dashArray: '6 6',
      }).addTo(map)
    }
    if (!drawing) {
      previewRef.current?.remove()
      previewRef.current = null
      snapRef.current?.remove()
      snapRef.current = null
    }
  }, [coordinates, drawing, map])

  useEffect(() => {
    if (!drawing || !snapEnabled || !cursor) {
      snapRef.current?.remove()
      snapRef.current = null
      return
    }
    snapRef.current ??= L.circleMarker(cursor, {
      radius: 8,
      color: '#2563eb',
      fillColor: '#fff',
      fillOpacity: 0.9,
      weight: 3,
    }).addTo(map)
    snapRef.current.setLatLng(cursor)
  }, [cursor, drawing, map, snapEnabled])

  useEffect(
    () => () => {
      lineRef.current?.remove()
      previewRef.current?.remove()
      markerGroupRef.current?.remove()
      snapRef.current?.remove()
    },
    []
  )

  if (!drawing || coordinates.length < 2) return null
  return (
    <div className="leaflet-bottom leaflet-right !mb-12 !mr-4 pointer-events-none z-[1000]">
      <div className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-white shadow-lg">
        {coordinates.length} điểm <span className="mx-2 text-slate-400">|</span>
        <strong className="text-emerald-400">
          {formatLength(calcPolylineLengthMeters(coordinates))}
        </strong>
      </div>
    </div>
  )
}
