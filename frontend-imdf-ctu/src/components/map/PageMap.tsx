import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import ModalLocation from './ModalLocation'
import { useState } from 'react'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

export default function PageMap() {
  const [isFoundLocation] = useState(true)

  const [isCloseModal, setIsCloseModal] = useState(false)

  // Toa do ban dau cua ban do
  const position: [number, number] = [10.03031, 105.76843]

  return (
    <div className="basemap relative h-full min-h-0 w-full rounded-2xl overflow-hidden border border-sky-500">
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
      </MapContainer>

      {/* SHOW KET QUA TIM KIEM */}
      {isFoundLocation && isCloseModal === false && (
        <ModalLocation setIsCloseModal={setIsCloseModal} />
      )}
    </div>
  )
}
