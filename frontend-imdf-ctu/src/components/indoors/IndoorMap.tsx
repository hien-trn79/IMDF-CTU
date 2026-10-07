import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface IndoorMapProps {
  setObjectCount: (count: number) => void
  selectedFeature: any
  onFeatureClick?: (feature: any) => void
}

export default function IndoorMap() {
  const position: [number, number] = [10.03031, 105.76843]

  return (
    <div className="indoor_map relative h-full w-full rounded-2xl overflow-hidden">
      <MapContainer
        center={position}
        minZoom={1}
        zoom={17}
        maxZoom={22}
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={22}
        />
      </MapContainer>
    </div>
  )
}
