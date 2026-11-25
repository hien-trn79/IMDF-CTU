export interface levelCategoryResponse {
  id: number
  levelCategoryName: string
  levelCategoryVietnameseName: string
}

export interface levelCategoryRequest {
  levelCategoryName: string
  levelCategoryVietnameseName: string
}

export interface LevelGeoJson {
  type: string
  features: LevelGeojsonItem[]
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}

export interface LevelGeojsonItem {
  type: string
  id: string
  geometry: {
    type: string
    coordinates: [string]
  }
  properties: {
    outdoor: boolean
    restrictionCategoryId: number
    levelId: string
    levelCategoryId: number
    ordinal: number
    displayPoint: {
      type: string
      coordinates: [number, number]
    }
  }
}
