export interface VenueGeoJson {
  type: string
  features: [
    {
      type: string
      id: string
      geometry: {
        type: string
        coordinates: [string]
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
    },
  ]
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}

export interface BuildingGeoJson {
  type: string
  features: BuildingGeoJsonItem[]
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}

export interface BuildingGeoJsonItem {
  type: string
  id: string
  geometry: {
    type: string
    coordinates: [string]
  }
  properties: {
    buildingName: string
    buildingCategoryName: string
    restrictionCategoryId: number
    featureId: string
    addressId: number
    buildingCategoryId: number
    displayPoint: {
      type: string
      coordinates: [number, number]
    }
  }
}

export interface LevelGeoJson {
  type: string
  features: [
    {
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
    },
  ]
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}

export interface UnitGeoJsonItem {
  type: 'Feature'
  id: string
  geometry: GeoJSON.Geometry
  properties: {
    unitName: string
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

export interface UnitGeoJson {
  type: 'FeatureCollection'
  features: UnitGeoJsonItem[]
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}

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

export interface AmenityGeojson {
  type: 'FeatureCollection'
  features: Array<{
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
  }>
  pagination: {
    totalPages: number
    pageSize: number
    isLast: boolean
    pageNumber: number
    totalElements: number
  }
}
