import type { Point } from 'geojson'

export interface NetworkNodeRequest {
  isConnector: boolean
  geometry: Point
  indoorRouteId: number
}

export interface NetworkNodeFeature {
  type: 'FeatureCollection'
  features: NetworkNodeItem[]
}

export interface NetworkNodeItem {
  type: 'Feature'
  id: string | number
  geometry: Point
  properties: {
    routeId: number
    isConnector: boolean
    routeType: string
    routeName: string
    ordinal: number
  }
  geom: string
  isConnector: boolean
  indoorRouteId: number
}

export type NetworkNodeResponse = NetworkNodeItem
