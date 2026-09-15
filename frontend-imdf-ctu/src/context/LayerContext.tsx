import { createContext, useContext, useState, type ReactNode } from 'react'
import type { LayerType } from '../model/Layer.model'

interface LayerContextType {
  selectedLayers: LayerType[]
  toggleLayer: (layer: LayerType) => void
  isLayerSelected: (id: string) => boolean
  clearLayers: () => void
  geoServerUrl: string
}

const LayerContext = createContext<LayerContextType | undefined>(undefined)

export const LayerProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLayers, setSelectedLayers] = useState<LayerType[]>([
    {
      id: 'file-ctu-buildings',
      layerName: 'imdf_ctu:ctu_buildings_4326',
      to: '/geojson/ctu_buildings_4326.geojson',
    },
  ])

  const geoServerUrl = '/geoserver'

  // Bật/tắt 1 layer: nếu đã có trong danh sách thì bỏ ra, chưa có thì thêm vào
  const toggleLayer = (layer: LayerType) => {
    setSelectedLayers((prev) => {
      const exists = prev.some((l) => l.id === layer.id)
      if (exists) {
        return prev.filter((l) => l.id !== layer.id)
      }
      return [...prev, layer]
    })
  }

  const isLayerSelected = (id: string) => selectedLayers.some((l) => l.id === id)

  const clearLayers = () => setSelectedLayers([])

  return (
    <LayerContext.Provider
      value={{ selectedLayers, toggleLayer, isLayerSelected, clearLayers, geoServerUrl }}
    >
      {children}
    </LayerContext.Provider>
  )
}

export const useLayer = () => {
  const context = useContext(LayerContext)
  if (!context) {
    throw new Error('useLayer must be used within a LayerProvider')
  }
  return context
}
