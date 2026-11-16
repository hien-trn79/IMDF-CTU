import type { StaircaseNode, UnitFeature } from '../model/IndoorRouting.model'
import type { IndoorRouteFeature } from '../model/Navigation.model'
import { authHeaders } from './authHeaders'

const API_BASE = 'http://localhost:8081/api'

export interface IndoorGeoJsonResponse {
  type: 'FeatureCollection'
  features?: IndoorRouteFeature[]
  pagination?: Record<string, unknown> | null
}

export interface IndoorShortestPathRequest {
  sourceNodeId: number | null
  sourceLocationType: string
  targetNodeId: number
  targetLocationType: string
  sourceLevelId: number | null
  targetLevelId: number
  isOutdoorIncluded: boolean
}

export async function fetchIndoorShortestPath(
  request: IndoorShortestPathRequest,
  token?: string
): Promise<IndoorGeoJsonResponse> {
  const response = await fetch(`${API_BASE}/shortest-path`, {
    method: 'POST',
    headers: { ...authHeaders(token ?? ''), 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const message = await response.text().catch(() => `HTTP ${response.status}`)
    throw new Error(`Không thể tìm đường đi nội tuyến: ${message}`)
  }
  return response.json() as Promise<IndoorGeoJsonResponse>
}

export async function fetchStaircaseNodes(
  levelId: number,
  token?: string
): Promise<StaircaseNode[]> {
  const response = await fetch(`${API_BASE}/routing/staircase-nodes?levelId=${levelId}`, {
    headers: authHeaders(token ?? ''),
  })
  if (!response.ok) throw new Error(`Không thể tải cầu thang (HTTP ${response.status}).`)
  return response.json() as Promise<StaircaseNode[]>
}

export async function fetchUnitsByLevel(levelId: number, token?: string): Promise<UnitFeature[]> {
  const response = await fetch(`${API_BASE}/units?levelId=${levelId}`, {
    headers: authHeaders(token ?? ''),
  })
  if (!response.ok) throw new Error(`Không thể tải unit theo tầng (HTTP ${response.status}).`)
  const data = await response.json()
  return (data.features ?? []).flatMap((feature: any) => {
    const geometry = feature.geometry
    const props = feature.properties ?? {}
    const point =
      geometry?.type === 'Point'
        ? geometry.coordinates
        : geometry?.type === 'MultiPolygon'
          ? geometry.coordinates?.[0]?.[0]?.[0]
          : null
    if (!Array.isArray(point) || point.length < 2) return []
    return [
      {
        id: Number(feature.id),
        unitName: props.unitName || 'Phòng',
        levelId: Number(props.levelId ?? levelId),
        levelOrdinal: Number(props.levelOrdinal ?? 0),
        coordinates: [Number(point[0]), Number(point[1])],
        geometry,
        unitCategory: props.unitCategory,
      } satisfies UnitFeature,
    ]
  })
}

export function segmentCoordsToLatLng(coords: [number, number][]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng])
}
