export interface IndoorRouteRequest {
  indoorRouteName: string;
  description?: string;
  startNodeId?: number;
  endNodeId?: number;
}

export interface IndoorRouteResponse {
  id: number;
  indoorRouteId: string; // UUID
  indoorRouteName: string;
  description?: string;
  startNodeId?: number;
  endNodeId?: number;
  createdAt: string;
  updatedAt: string;
}
