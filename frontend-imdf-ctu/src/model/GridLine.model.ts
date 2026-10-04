export interface GridLineRequest {
  category: string;
  isOneWay: boolean;
  indoorRouteId: number;
  geom: string; // WKB Hex
}

export interface GridLineResponse {
  id: number;
  gridLineId: string; // UUID
  category: string;
  isOneWay: boolean;
  indoorRouteId: number;
  indoorRouteName: string;
  geom: string; // WKB Hex
}
