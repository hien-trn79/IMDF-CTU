export interface IndoorRouteRequest {
  indoorRouteName: string
  description?: string
  startNodeId?: number
  endNodeId?: number
}

export interface IndoorRouteResponse {
  id: number
  indoorRouteId: string // UUID
  indoorRouteName: string
  description?: string
  startNodeId?: number
  endNodeId?: number
  createdAt: string
  updatedAt: string
}

export const GridlineType = {
  CORRIDOR: 'CORRIDOR',
  STAIR: 'STAIR',
  ELEVATOR: 'ELEVATOR',
  ESCALATOR: 'ESCALATOR',
  DOOR: 'DOOR',
  ENTRANCE: 'ENTRANCE',
}

export type GridlineType = (typeof GridlineType)[keyof typeof GridlineType]

// Cac thuc the trong IMDF
export interface AnchorRequestPayload {
  anchorName: string
  geometry: GeoJSON.Geometry
  featureId: number | null
  unitId: number
}
