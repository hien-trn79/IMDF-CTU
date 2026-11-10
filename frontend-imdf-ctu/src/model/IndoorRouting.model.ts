/**
 * Model dữ liệu cho chức năng tìm đường đi ngắn nhất indoor
 */

/** Loại segment đường đi */
export type PathSegmentType = 'FLOOR_PATH' | 'STAIR_UP' | 'STAIR_DOWN' | 'STAIR_TRANSITION'

/** 1 đoạn đường đi trên 1 tầng */
export interface ShortestPathSegment {
  levelId: number
  ordinal: number // 0 = tầng trệt G, 1 = tầng 1, ...
  coordinates: [number, number][] // [[lng, lat], ...] GeoJSON convention
  segmentType: PathSegmentType
  stairNodeId?: number
  stairCoord?: [number, number] // [lng, lat]
  targetFloorOrdinal?: number // tầng cần đến khi gặp cầu thang
}

/** Kết quả tìm đường ngắn nhất indoor */
export interface IndoorShortestPathResponse {
  segments: ShortestPathSegment[]
  totalDistanceMeters: number
  estimatedTimeSeconds: number
  found: boolean
  message?: string
  sourceLevelId?: number
  targetLevelId?: number
}

/** Request gửi lên backend */
export interface IndoorShortestPathRequest {
  sourceLevelId?: number
  sourceLat: number
  sourceLng: number
  targetUnitId: number
  buildingId?: number
}

/** Thông tin node cầu thang */
export interface StaircaseNode {
  id: number
  coordinates: [number, number] // [lng, lat]
  levelId: number
  ordinal: number
}

/** Dữ liệu Unit phòng học từ API */
export interface UnitFeature {
  id: number | string
  unitName: string
  levelId: number
  levelOrdinal: number
  coordinates: [number, number] // display_point [lng, lat]
  geometry?: any // MultiPolygon GeoJSON
  unitCategory?: string
}
