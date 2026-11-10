export interface DestinationItem {
  id: string
  title: string
  subtitle?: string
  category: 'room' | 'building' | 'amenity' | 'custom'
  roomCode?: string
  anchorName?: string
  level?: string
  buildingName?: string
  address?: string
  coordinates: [number, number] // [lat, lng]
  geometry?: any // GeoJSON Polygon / Point / MultiPolygon
  doorCoordinates?: [number, number] // [lat, lng]
  anchorCoordinates?: [number, number] // [lat, lng]
  rawProperties?: Record<string, any>
  source?: 'internal' | 'geocoding'
}

export interface RouteStep {
  instruction: string
  distance: number // meters
  duration: number // seconds
  name?: string
  isIndoor?: boolean
}

export interface RouteData {
  coordinates: [number, number][] // [lat, lng]
  outdoorCoordinates?: [number, number][]
  distanceMeters: number
  durationSeconds: number
  distanceText: string
  durationText: string
  startPoint: [number, number] // [lat, lng]
  endPoint: [number, number] // [lat, lng]
  destination: DestinationItem
  steps: RouteStep[]
  hasIndoorTransition?: boolean
  mainEntrancePoint?: [number, number] // [lat, lng]
  indoorCoordinates?: [number, number][] // [lat, lng]
  // Indoor shortest path data (from topology network)
  indoorPathSegments?: import('./IndoorRouting.model').ShortestPathSegment[]
  targetUnitId?: number
  targetLevelOrdinal?: number
  indoorGeoJsonFeatures?: IndoorRouteFeature[]
}

export interface IndoorRouteFeature {
  type: 'Feature'
  id?: number | string
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
  properties?: Record<string, unknown>
}
