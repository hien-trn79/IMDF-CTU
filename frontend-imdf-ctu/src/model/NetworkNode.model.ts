// geom: WKB Hex string (Point), backend trả về dạng 0000000001...
export interface NetworkNodeResponse {
  id: number
  isConnector: boolean | null
  geom: string // WKB Hex string (Point)
  indoorRouteId: number
  indoorRouteName: string
}

export interface NetworkNodeRequest {
  isConnector: boolean
  geom: string // WKB Hex string (Point)
  indoorRouteId: number
}
