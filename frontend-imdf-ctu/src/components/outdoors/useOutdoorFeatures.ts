import { useEffect, useMemo, useState } from 'react'
import { useLayer } from '../../context/LayerContext'
import { useLevel } from '../../context/LevelContext'

export function useOutdoorFeatures() {
  const { selectedLayers, availableLayers, geoServerUrl } = useLayer()
  const { unitGeoJson, isLoadingUnits, selectedTable } = useLevel()
  const [layerFeatures, setLayerFeatures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const tableLayers = useMemo(() => {
    if (selectedTable === 'unit') return []
    const matches = (layer: { layerName: string }) =>
      (() => {
        const name = (layer.layerName.split(':').pop() ?? layer.layerName).toLowerCase()
        const table = selectedTable.toLowerCase()
        return name === table || name.startsWith(`${table}_`)
      })()
    const selectedMatches = selectedLayers.filter(matches)
    return selectedMatches.length > 0 ? selectedMatches : availableLayers.filter(matches)
  }, [availableLayers, selectedLayers, selectedTable])

  useEffect(() => {
    if (tableLayers.length === 0) {
      setLayerFeatures([])
      return
    }

    const fetchAllFeatures = async () => {
      setIsLoading(true)

      try {
        // Lấy danh sách layer do người dùng chủ động chọn.
        const layerNames = tableLayers.map((l) => l.layerName).join(',')

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
            tableLayers.find((l) => l.layerName.includes(layerType)) || tableLayers[0]

          return {
            feature,
            layer: layerObj,
            index,
          }
        })

        setLayerFeatures(parsedFeatures)
      } catch (err) {
        console.error('Lỗi khi fetch features:', err)
        setLayerFeatures([])
      } finally {
        setIsLoading(false)
      }
    } // end fetchAllFeatures

    fetchAllFeatures()
  }, [geoServerUrl, tableLayers]) // end useEffect

  const features = useMemo(() => {
    const unitFeatures =
      selectedTable === 'unit'
        ? (unitGeoJson?.features ?? []).map((feature, index) => ({
      feature,
      layer: { id: 'api-units', layerName: 'units' },
      index,
          }))
        : []
    return [...unitFeatures, ...layerFeatures]
  }, [layerFeatures, selectedTable, unitGeoJson])

  return { features, isLoading: isLoading || isLoadingUnits }
}
