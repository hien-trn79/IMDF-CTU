// geometry: WKB Hex string (LineString), backend trả về dạng 000000000200000002...
export interface NetworkEdgeResponse {
  id: number
  source: number
  target: number
  cost: number
  reverseCost: number
  geometry: string // WKB Hex string (LineString)
  indoorRouteId: number
  indoorRouteName: string
}

export interface NetworkEdgeRequest {
  source: number
  target: number
  cost: number
  reverseCost: number
  geometry: string // WKB Hex string (LineString)
  indoorRouteId: number
}
