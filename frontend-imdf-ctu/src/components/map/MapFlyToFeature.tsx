import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

// Helper zoom đến feature trên React-Leaflet
export function MapFlyToFeature({ selectedFeature }: { selectedFeature: any }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedFeature?.feature) return

    // Tạo geoJSON layer tạm để tính toán bounds
    const geoJsonLayer = L.geoJSON(selectedFeature.feature)
    const bounds = geoJsonLayer.getBounds()

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: true })
    }
  }, [selectedFeature, map])

  return null
}
