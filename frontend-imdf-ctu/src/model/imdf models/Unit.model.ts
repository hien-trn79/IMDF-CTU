export interface UnitRequestPayload {
  unitName: string
  geometry: GeoJSON.Geometry
  displayPoint: GeoJSON.Geometry
  featureId: number | null
  levelId: number
  unitCategoryId: number
  restrictionCategoryId: number
}

export interface UnitCategoriesResponse {
  id: number
  unitCategoryName: string
  unitCategoryVietnameseName: string
}

export interface UnitCategoryRequest {
  unitCategoryName: string
  unitCategoryVietnameseName: string
}

export interface UnitGeojsonItem {
  type: 'Feature'
  id: string
  geometry: GeoJSON.Geometry
  properties: {
    unitName: string
    levelId: number
    levelOrdinal: number
    restrictionCategory: string
    restrictionCategoryId: number
    unitCategory: string
    unitCategoryId: string
    featureId: string
    featureType: string
    displayPoint: {
      type: string
      coordinates: [number, number]
    }
  }
}

export interface UnitGeojson {
  type: 'FeatureCollection'
  features: UnitGeojsonItem[]
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}
