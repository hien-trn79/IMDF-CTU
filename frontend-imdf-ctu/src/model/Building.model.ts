export interface BuildingType {
  id: string
  geometry: {
    type: string
    coordinates: any[]
  }
  properties: {
    id: string
    building: string
    name: string
    'name:vi': string
  }
}

export interface BuildingCategoryResposne {
  id: number
  buildingCategoryName: string
  buildingCategoryVietnameseName: string
}

export interface BuildingCategoryRequest {
  buildingCategoryName: string
  buildingCategoryVietnameseName: string
}

export interface BuildingGeojsonResponse {
  type: 'FeatureCollection'
  features: BuildingGeojsonItem[]
  pagination: null
}

export interface BuildingGeojsonItem {
  type: 'Feature'
  id: 1
  geometry: {
    type: 'MultiPolygon'
    coordinates: [[[[number, number]]]]
  }
  properties: {
    venueName: string
    buildingName: string
    buildingCategoryName: string
    restrictionCategoryId: number
    restrictionCategoryName: string
    venueId: number
    featureId: string
    addressId: number
    buildingCategoryId: number
    displayPoint: {
      type: 'Point'
      coordinates: [number, number]
    }
  }
}
