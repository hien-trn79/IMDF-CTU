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
