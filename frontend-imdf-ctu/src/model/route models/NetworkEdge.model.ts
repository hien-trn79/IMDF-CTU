import type { LineString, MultiLineString } from 'geojson'

export interface NetworkEdgeRequest {
  source: number
  target: number
  cost: number
  reverseCost: number
  geometry: LineString
  indoorRouteId: number
}

export interface NetworkEdgeFeature {
  type: 'FeatureCollection'
  features: NetworkEdgeItem[]
}

export interface NetworkEdgeItem {
  type: 'Feature'
  id: string | number
  geometry: LineString | MultiLineString
  properties: {
    sourceNode: number
    cost: number
    routeId: number
    reverseCost: number
    targetNode: number
    routeType: string
    routeName: string
    ordinal: number
  }
  source: number
  target: number
  cost: number
  reverseCost: number
  indoorRouteId: number
  geometryWkb: string
}

export type NetworkEdgeResponse = NetworkEdgeItem
