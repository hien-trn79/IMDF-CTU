export interface AmenityCategoryResponse {
  amenityCateId: number
  amenityCateName: string
  amenityVietNameseName: string
}

export interface AmenityCategoryRequest {
  amenityCateName: string
  amenityVietNameseName: string
}

export interface AmenityResquestPayload {
  amenityName: string
  geometry: {
    type: string
    coordinates: [number, number][]
  }
  phone: string | null
  website: string | null
  hours: string | null
  amenityCategoryId: number
  featureId: number | null
  unitId: number | null
  levelId: number
}

export interface AmenityGeojson {
  type: 'FeatureCollection'
  features: Array<AmenityGeojsonItem>
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}

export interface AmenityGeojsonItem {
  type: 'Feature'
  id: string
  geometry: GeoJSON.Geometry
  properties: {
    amenityCateName: string
    unitName: string
    amenityName: string
    featureType: string
    unitId: string
    amenityCateId: number
    featureId: number
    createAt: string
    ordinal: number
  }
}
