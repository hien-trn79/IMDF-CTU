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
