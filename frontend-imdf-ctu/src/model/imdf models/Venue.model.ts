export interface VenueCategoryResponse {
  id: number
  venueCategoryName: string
  venueCategoryVietnameseName: string
}

export interface VenuCategoryRequest {
  venueCategoryName: string
  venueCategoryVietnameseName: string
}

export interface VenueGeojsonResponse {
  type: 'FeatureCollection'
  features: VenueGeojsonItem[]
  pagination: null
}

export interface VenueGeojsonItem {
  type: 'Feature'
  id: number
  geometry: {
    type: string
    coordinates: [[[number, number]]]
  }
  properties: {
    venueName: string
    restricttionCategoryName: string
    restrictionCategoryId: number
    venueId: string
    venueCategoryName: string
    featureType: string
    addressName: string
    venueCategoryId: number
    featureId: string
    addressId: number
  }
}
