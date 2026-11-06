import type { LineString, MultiLineString } from 'geojson'

export const PreTopologyCategory = {
  CORRIDOR: 'CORRIDOR',
  STAIR: 'STAIR',
  RAMP: 'RAMP',
  DOOR: 'DOOR',
  ENTRANCE: 'ENTRANCE',
} as const

// Tạo type tương ứng từ object trên
export type PreTopologyCategory = (typeof PreTopologyCategory)[keyof typeof PreTopologyCategory]

export interface PreTopologyResponse {
  type: 'FeatureCollection'
  features: PreTopologyItem[]
}

export interface PreTopologyItem {
  type: 'Feature'
  id: string | number
  geometry: LineString | MultiLineString
  properties: {
    preTopologyId: string
    routeId: number
    isOneWay: boolean
    category: string
    routeType: string
    routeName: string
    ordinal: number
  }
}

export interface RouteResponse {
  id: number
  indoorRouteId: string
  indoorRouteName: string
  indoorRouteType: 'MAIN' | 'SECONDARY'
  status: 'ACTIVE' | 'INACTIVE'
  levelId: number
  ordinal: number
}
