import { useEffect, useState } from 'react'
import { useLayer } from '../../context/LayerContext'

export function useOutdoorFeatures() {
  const { selectedLayers, geoServerUrl } = useLayer()
  const [features, setFeatures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedLayers.length === 0) {
      setFeatures([])
      return
    }

    const fetchAllFeatures = async () => {
      setIsLoading(true)

      try {
        // Lấy danh sách tên layer (VD: imdf_ctu:amenity, imdf_ctu:wall,...)
        const layerNames = selectedLayers.map((l) => l.layerName).join(',')

        // Gọi GeoServer WFS Request lấy GeoJSON
        const url = `${geoServerUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${layerNames}&outputFormat=application/json`

        const res = await fetch(url)
        if (!res.ok) throw new Error('Không thể lấy dữ liệu WFS từ GeoServer')

        const data = await res.json()

        // Bổ sung thông tin layer tương ứng vào từng feature
        const parsedFeatures = (data.features || []).map((feature: any, index: number) => {
          // Lấy prefix layer name từ ID feature (GeoServer thường trả id dạng: 'amenity.1')
          const layerType = feature.id ? feature.id.split('.')[0] : ''
          const layerObj =
            selectedLayers.find((l) => l.layerName.includes(layerType)) || selectedLayers[0]

          return {
            feature,
            layer: layerObj,
            index,
          }
        })

        setFeatures(parsedFeatures)
      } catch (err) {
        console.error('Lỗi khi fetch features:', err)
        setFeatures([])
      } finally {
        setIsLoading(false)
      }
    } // end fetchAllFeatures

    fetchAllFeatures()
  }, [selectedLayers, geoServerUrl]) // end useEffect
  return { features, isLoading }
}
