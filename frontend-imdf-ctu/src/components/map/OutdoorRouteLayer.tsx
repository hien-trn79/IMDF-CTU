import { CircleMarker, Polyline } from 'react-leaflet'
import type { RouteData } from './OutdoorRoutingService'

// Vẽ đường đi ngoài trời (viền trắng + lõi xanh) và điểm xuất phát.
// Đường nội tuyến vẽ riêng bằng IndoorFloorPathLayer.
export default function OutdoorRouteLayer({ route }: { route: RouteData | null }) {
  if (!route || route.coordinates.length < 2) return null

  const line = { lineCap: 'round', lineJoin: 'round' } as const

  return (
    <>
      <Polyline
        positions={route.coordinates}
        pathOptions={{ ...line, color: '#ffffff', weight: 9, opacity: 0.95 }}
      />
      <Polyline
        positions={route.coordinates}
        pathOptions={{ ...line, color: '#2563eb', weight: 5 }}
      />
      <CircleMarker
        center={route.coordinates[0]}
        radius={7}
        pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
      />
    </>
  )
}
