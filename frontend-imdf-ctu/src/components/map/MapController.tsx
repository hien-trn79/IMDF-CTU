import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface MapControllerProps {
  selectedFeature: any
}

export default function MapController({ selectedFeature }: MapControllerProps) {
  const map = useMap()

  useEffect(() => {
    if (!selectedFeature?.feature) return

    // Chuyển feature sang dạng GeoJSON layer để lấy bounds tự động
    const geoJsonLayer = L.geoJSON(selectedFeature.feature)
    const bounds = geoJsonLayer.getBounds()

    if (bounds.isValid()) {
      // Zoom và căn giữa đối tượng trên bản đồ với khoảng đệm 50px
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 20, animate: true })
    }
  }, [selectedFeature, map])

  return null
}
