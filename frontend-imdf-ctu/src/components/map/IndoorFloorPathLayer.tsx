import { useEffect, useState, useRef } from 'react'
import { Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { ShortestPathSegment } from '../../model/IndoorRouting.model'
import { segmentCoordsToLatLng } from '../../services/indoorRoutingService'

interface IndoorFloorPathProps {
  /** Các đoạn đường của tầng hiện tại */
  segments: ShortestPathSegment[]
  /** ordinal của tầng đang hiển thị (0=G, 1, 2...) */
  currentOrdinal: number
  /** Có đang loading không */
  isLoading?: boolean
}

/** Icon số tầng cầu thang (animated) */
function createStairIcon(floorOrdinal: number, direction: 'up' | 'down') {
  const label = floorOrdinal === 0 ? 'G' : `T${floorOrdinal}`
  const arrowSvg =
    direction === 'up'
      ? `<path d="M12 19V5m-7 7l7-7 7 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M12 5v14m-7-7l7 7 7-7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`

  const bgColor = direction === 'up' ? '#6366f1' : '#8b5cf6'

  return L.divIcon({
    className: 'indoor-stair-icon',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
      ">
        <div style="
          background: ${bgColor};
          border: 3px solid white;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: stairPulse 1.6s ease-in-out infinite;
          box-shadow: 0 0 0 0 ${bgColor}60;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            ${arrowSvg}
          </svg>
        </div>
        <div style="
          margin-top: 3px;
          background: ${bgColor};
          color: white;
          font-size: 11px;
          font-weight: 900;
          font-family: system-ui, sans-serif;
          padding: 2px 7px;
          border-radius: 10px;
          border: 2px solid white;
          letter-spacing: 0.03em;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${label}
        </div>
      </div>
      <style>
        @keyframes stairPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 ${bgColor}60; }
          50% { transform: scale(1.1); box-shadow: 0 0 0 10px ${bgColor}00; }
        }
      </style>
    `,
    iconSize: [44, 68],
    iconAnchor: [22, 44],
    popupAnchor: [0, -50],
  })
}

/** Component tự động fitBounds khi có indoor path mới */
function IndoorPathCameraFitter({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  const fittedRef = useRef<string>('')

  useEffect(() => {
    if (coords.length < 2) return
    const key = coords.map((c) => c.join(',')).join('|')
    if (fittedRef.current === key) return
    fittedRef.current = key

    const bounds = L.latLngBounds(coords)
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 20, animate: true, duration: 0.8 })
  }, [coords, map])

  return null
}

/** Layer hiển thị đường đi indoor trên 1 tầng cụ thể */
export default function IndoorFloorPathLayer({
  segments,
  currentOrdinal,
  isLoading = false,
}: IndoorFloorPathProps) {
  const [animOffset, setAnimOffset] = useState(0)

  // Animation dash offset cho đường đi
  useEffect(() => {
    if (isLoading) return
    let frame: number
    let val = 0
    const animate = () => {
      val = (val + 0.5) % 24
      setAnimOffset(val)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isLoading])

  // Lọc segments của tầng hiện tại
  const currentSegments = segments.filter((s) => s.ordinal === currentOrdinal)
  const floorSegments = currentSegments.filter((s) => s.segmentType === 'FLOOR_PATH')
  const stairSegments = currentSegments.filter(
    (s) => s.segmentType === 'STAIR_UP' || s.segmentType === 'STAIR_DOWN'
  )

  // Gom tất cả coordinates của tầng để fitBounds
  const allFloorCoords: [number, number][] = floorSegments.flatMap((s) =>
    segmentCoordsToLatLng(s.coordinates)
  )

  if (currentSegments.length === 0) return null

  return (
    <>
      {/* Camera fitter */}
      {allFloorCoords.length >= 2 && <IndoorPathCameraFitter coords={allFloorCoords} />}

      {/* Vẽ từng đoạn FLOOR_PATH */}
      {floorSegments.map((seg, idx) => {
        const positions = segmentCoordsToLatLng(seg.coordinates)
        if (positions.length < 2) return null

        return (
          <span key={`floor-${idx}`}>
            {/* Shadow layer */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#0f172a',
                weight: 11,
                opacity: 0.12,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* White casing */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#ffffff',
                weight: 8,
                opacity: 0.98,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Core blue path */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#3b82f6',
                weight: 5,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Animated dash accent */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#bfdbfe',
                weight: 2,
                opacity: 0.8,
                dashArray: '6 14',
                dashOffset: String(animOffset),
                lineCap: 'round',
              }}
            />
          </span>
        )
      })}

      {/* Stair markers */}
      {stairSegments.map((seg, idx) => {
        if (!seg.stairCoord) return null
        const [lng, lat] = seg.stairCoord
        const direction = seg.segmentType === 'STAIR_UP' ? 'up' : 'down'
        const targetOrdinal = seg.targetFloorOrdinal ?? currentOrdinal
        const icon = createStairIcon(targetOrdinal, direction)

        return (
          <Marker key={`stair-${idx}`} position={[lat, lng]} icon={icon}>
          </Marker>
        )
      })}
    </>
  )
}
