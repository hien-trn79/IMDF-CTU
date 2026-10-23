export interface DestinationItem {
  id: string
  title: string
  subtitle?: string
  category: 'room' | 'building' | 'amenity' | 'custom'
  roomCode?: string
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
}
