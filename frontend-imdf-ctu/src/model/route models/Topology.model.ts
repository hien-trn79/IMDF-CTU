export interface TopologyResponse {
  id: number
  indoorRouteId: string
  indoorRouteName: string
  indoorRouteType: string
  status: string
  levelId: number
  ordinal: number
}

export interface TopologyRequest {
  indoorRouteName: string
  indoorRouteType: string
  status: string
  levelId: number
}
