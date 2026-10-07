import type { LayerType } from '../../model/Layer.model'

export interface LayerFetchState {
  data: any | null
  loading: boolean
  error: string | null
}

export interface OutdoorFeature {
  feature: any
  layer: LayerType
  index: number
}

export const LAYER_COLORS = [
  '#2563eb',
  '#f97316',
  '#16a34a',
  '#dc2626',
  '#9333ea',
  '#0891b2',
  '#ca8a04',
]

export const getLayerLabel = (layerName: string) => layerName.split(':').pop() ?? layerName

export const getFeatureProperty = (feature: any, keys: string[]) => {
  const properties = feature?.properties ?? {}
  const key = keys.find((candidate) => properties[candidate] !== undefined)
  return key ? String(properties[key]) : '—'
}
