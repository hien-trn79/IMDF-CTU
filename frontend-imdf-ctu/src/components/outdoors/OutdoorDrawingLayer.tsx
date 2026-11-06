import { useEffect, useRef, useState } from 'react'
import { calcPolylineLengthMeters, formatLength } from '../../utils/wkbUtils'
import { useMap, useMapEvents } from 'react-leaflet'
import { findSnapTarget } from '../../utils/imdfSnapUtils'

import L from 'leaflet'

interface OutdoorDrawingLayerProps {
  drawing: boolean
  snapEnabled: boolean
  coordinates: [number, number][]
  features: any[]
  onCoordinatesChange: (coordinates: [number, number][]) => void
  pointMode: boolean
}

export default function OutdoorDrawingLayer({
  drawing,
  snapEnabled,
  coordinates,
  features,
  onCoordinatesChange,
  pointMode,
}: Pick<
  OutdoorDrawingLayerProps,
  'drawing' | 'snapEnabled' | 'coordinates' | 'features' | 'onCoordinatesChange' | 'pointMode'
>) {
  const map = useMap()
  const lineRef = useRef<L.Polyline | L.Polygon | null>(null)
  const previewRef = useRef<L.Polyline | null>(null)
  const markerRef = useRef<L.LayerGroup | null>(null)
  const pointMarkerRef = useRef<L.CircleMarker | null>(null)
  const snapRef = useRef<L.CircleMarker | null>(null)
  const [cursor, setCursor] = useState<L.LatLng | null>(null)

  const findSnap = (point: L.LatLng) => {
    if (!snapEnabled) return point
    return findSnapTarget(
      point,
      map,
      features.map((item) => item.feature)
    ).latLng
  }

  useMapEvents({
    mousemove(event) {
      if (!drawing) return
      const snapped = findSnap(event.latlng)
      setCursor(snapped)
      if (!pointMode && coordinates.length > 0) {
        const last = coordinates[coordinates.length - 1]
        const next = [
          [last[1], last[0]],
          [snapped.lat, snapped.lng],
        ] as L.LatLngExpression[]
        if (!previewRef.current) {
          previewRef.current = L.polyline(next, {
            color: '#2563eb',
            weight: 3,
            dashArray: '6 6',
          }).addTo(map)
        } else {
          previewRef.current.setLatLngs(next)
        }
      }
    },
    click(event) {
      if (!drawing) return
      const point = findSnap(event.latlng)
      const coordinate: [number, number] = [point.lng, point.lat]
      if (pointMode) {
        onCoordinatesChange([coordinate])
        return
      }
      const last = coordinates[coordinates.length - 1]
      if (
        last &&
        Math.abs(last[0] - coordinate[0]) < 1e-8 &&
        Math.abs(last[1] - coordinate[1]) < 1e-8
      )
        return
      onCoordinatesChange([...coordinates, coordinate])
    },
  })

  useEffect(() => {
    if (!markerRef.current) markerRef.current = L.layerGroup().addTo(map)
    markerRef.current.clearLayers()
    lineRef.current?.remove()
    lineRef.current = null
    pointMarkerRef.current?.remove()
    pointMarkerRef.current = null
    if (coordinates.length > 0) {
      if (pointMode) {
        const [lng, lat] = coordinates[0]
        pointMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 11,
          color: '#dc2626',
          fillColor: '#fef08a',
          fillOpacity: 1,
          weight: 4,
          pane: 'markerPane',
        })
          .bindTooltip('Điểm đang chọn', { permanent: true, direction: 'top', offset: [0, -8] })
          .addTo(map)
        pointMarkerRef.current.bringToFront()
      } else {
        const latLngs = coordinates.map(([lng, lat]) => [lat, lng] as L.LatLngExpression)
        const line =
          coordinates.length >= 3
            ? L.polygon(latLngs, {
                color: '#059669',
                weight: 4,
                dashArray: drawing ? '6 4' : undefined,
                opacity: 0.95,
                fillColor: '#34d399',
                fillOpacity: 0.2,
                lineCap: 'round',
                lineJoin: 'round',
              })
            : L.polyline(latLngs, {
                color: '#059669',
                weight: 4,
                dashArray: drawing ? '6 4' : undefined,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              })
        lineRef.current = line
        // Keep the Unit outline on the map independently from the vertex markers.
        // This prevents the line from being cleared when drawing mode is stopped
        // after the Unit has been saved.
        line.addTo(map)
        line.bringToFront()
        coordinates.forEach(([lng, lat], index) =>
          L.circleMarker([lat, lng], {
            radius: 5,
            color: '#047857',
            fillColor: '#d1fae5',
            fillOpacity: 1,
            weight: 2,
          })
            .bindTooltip(`Điểm ${index + 1}`, { direction: 'top' })
            .addTo(markerRef.current!)
        )
      }
    }
    if (!drawing) {
      previewRef.current?.remove()
      previewRef.current = null
      snapRef.current?.remove()
      snapRef.current = null
      pointMarkerRef.current?.remove()
      pointMarkerRef.current = null
    }
  }, [coordinates, drawing, map, pointMode])

  useEffect(() => {
    if (!drawing || !cursor || !snapEnabled) {
      snapRef.current?.remove()
      snapRef.current = null
      return
    }
    if (!snapRef.current)
      snapRef.current = L.circleMarker(cursor, {
        radius: 8,
        color: '#2563eb',
        fillColor: '#fff',
        fillOpacity: 0.9,
        weight: 3,
      }).addTo(map)
    else snapRef.current.setLatLng(cursor)
  }, [cursor, drawing, map, snapEnabled])

  useEffect(
    () => () => {
      lineRef.current?.remove()
      previewRef.current?.remove()
      markerRef.current?.remove()
      snapRef.current?.remove()
      pointMarkerRef.current?.remove()
    },
    []
  )

  const lengthMeters =
    !pointMode && coordinates.length >= 2 ? calcPolylineLengthMeters(coordinates) : 0

  return drawing && coordinates.length > 0 ? (
    <div className="leaflet-bottom leaflet-right !mb-12 !mr-4 pointer-events-none z-[1000]">
      <div className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur">
        <span>{pointMode ? 'Đã chọn 1 điểm' : `${coordinates.length} điểm`}</span>
        {!pointMode && (
          <>
            <span className="mx-2 text-slate-400">|</span>
            <span>
              Nét vẽ: <strong className="text-emerald-400">{formatLength(lengthMeters)}</strong>
            </span>
          </>
        )}
      </div>
    </div>
  ) : null
}
