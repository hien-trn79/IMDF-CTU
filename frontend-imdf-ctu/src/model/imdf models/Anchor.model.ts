export interface AnchorGeojsonItem {
  type: 'Feature'
  id: string
  geometry: GeoJSON.Geometry
  properties: {
    unitName: string
    featureType: string
    unitId: number
    anchorName: string
    featureId: string
    createAt: string
    ordinal: number
  }
}

export interface AnchorGeojson {
  type: 'FeatureCollection'
  features: AnchorGeojsonItem[]
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}
