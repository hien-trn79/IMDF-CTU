import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { LayerType } from '../model/Layer.model'

interface LayerContextType {
  selectedLayers: LayerType[]
  toggleLayer: (layer: LayerType) => void
  isLayerSelected: (id: string) => boolean
  clearLayers: () => void
  availableLayers: LayerType[]
  isLoadingLayers: boolean
  layerCatalogError: string | null
  refreshLayers: () => void
  refreshVersion: number
  geoServerUrl: string
}

const LayerContext = createContext<LayerContextType | undefined>(undefined)

export const LayerProvider = ({ children }: { children: ReactNode }) => {
  const geoServerUrl = '/geoserver'

  const [availableLayers, setAvailableLayers] = useState<LayerType[]>([])
  const [selectedLayers, setSelectedLayers] = useState<LayerType[]>([])
  const [isLoadingLayers, setIsLoadingLayers] = useState(false)
  const [layerCatalogError, setLayerCatalogError] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)

  const folderLayer = 'imdf_ctu' // Thư mục chứa các layer trong Geoserver

  // Ham fetch list layers tu Geoserver
  const fetchLayersFromGeoServer = useCallback(async () => {
    setIsLoadingLayers(true)
    setLayerCatalogError(null)

    try {
      // Yeu cau GetCapabilities tu Geoserver
      const response = await fetch(
        `${geoServerUrl}/${folderLayer}/wms?service=WMS&request=GetCapabilities`
      )

      if (!response.ok) {
        throw new Error(`LayerContext file: Lỗi HTTP: ${response.status} ${response.statusText}`)
      }

      const xmlText = await response.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

      // Check loi khi parse XML
      const passerError = xmlDoc.querySelector('parsererror')
      if (passerError) {
        throw new Error(`LayerContext file: Lỗi khi phân tích XML: ${passerError.textContent}`)
      }

      // Lay danh sach layer tu XML
      const layerNodes = xmlDoc.querySelectorAll('Capability > Layer > Layer')
      const fetchedLayers: LayerType[] = Array.from(layerNodes)
        .map((layerNode) => {
          const nameNode = layerNode.querySelector('Name')
          const titleNode = layerNode.querySelector('Title')
          const layerName = nameNode ? nameNode.textContent || '' : ''
          const title = titleNode ? titleNode.textContent || '' : ''
          const features = layerNode.querySelectorAll('FeatureTypeList > FeatureType')

          return {
            id: `layer-${layerName.replace(':', '-')}`,
            layerName: layerName,
            title: title,
            to: '',
            features: Array.from(features).map((featureNode) => {
              const featureNameNode = featureNode.querySelector('Name')
              const featureTitleNode = featureNode.querySelector('Title')
              return {
                name: featureNameNode ? featureNameNode.textContent || '' : '',
                title: featureTitleNode ? featureTitleNode.textContent || '' : '',
              }
            }),
          }
        }) // end map
        .filter((layer) => layer.layerName != '') // Loai bo layer khong co ten

      setAvailableLayers(fetchedLayers)

      // Đặt mặc định layer được chọn (ví dụ: layer 'imdf_ctu:cntt-outline' hoặc layer đầu tiên)
      setSelectedLayers((prev) => {
        if (prev.length > 0) return prev // Giữ lại lựa chọn hiện tại nếu có
        const defaultLayer = fetchedLayers.find((l) => l.layerName === 'imdf_ctu:cntt-outline')
        return defaultLayer ? [defaultLayer] : fetchedLayers.slice(0, 1)
      })
    } catch (error: any) {
      // end try
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Lỗi không xác định khi tải fetch Layer. file: LayerContext.tsx'
      setLayerCatalogError(errorMessage)
    } finally {
      // end catch
      setIsLoadingLayers(false)
    }
  }, [geoServerUrl]) // end useCallback

  // Tự động gọi fetch khi Component mount hoặc khi refreshVersion thay đổi
  useEffect(() => {
    fetchLayersFromGeoServer()
  }, [fetchLayersFromGeoServer, refreshVersion]) // end useEffect

  const toggleLayer = (layer: LayerType) => {
    setSelectedLayers((prev) => {
      const exists = prev.some((l) => l.id === layer.id)
      if (exists) {
        return prev.filter((l) => l.id !== layer.id)
      }
      return [...prev, layer]
    })
  } // end toggleLayer

  const isLayerSelected = (id: string) => {
    return selectedLayers.some((layer) => layer.id === id)
  } // end isLayerSelected

  const clearLayers = () => {
    setSelectedLayers([])
  } // end clearLayers

  const refreshLayers = () => {
    setRefreshVersion((prev) => prev + 1)
  } // end refreshLayers

  return (
    <LayerContext.Provider
      value={{
        selectedLayers,
        toggleLayer,
        isLayerSelected,
        clearLayers,
        availableLayers,
        isLoadingLayers,
        layerCatalogError,
        refreshLayers,
        refreshVersion,
        geoServerUrl,
      }}
    >
      {children}
    </LayerContext.Provider>
  ) // end return
} // end LayerProvider

export const useLayer = () => {
  const context = useContext(LayerContext)
  if (!context) {
    throw new Error('useLayer phải được sử dụng trong LayerProvider')
  }
  return context
}
