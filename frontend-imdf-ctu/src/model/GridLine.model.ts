import type { GridlineType } from './IndoorRoute.model'
import type { LineString } from 'geojson'

export interface GridLineRequest {
  category: GridlineType
  isOneWay: boolean
  indoorRouteId: number
  geometry: LineString
}

export interface GridLineResponse {
  id: number
  gridLineId: string // UUID
  category: string
  isOneWay: boolean
  indoorRouteId: number
  indoorRouteName: string
  geom: string // WKB Hex
}
