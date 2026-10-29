import L from 'leaflet'
import type { Feature, Geometry } from 'geojson'
import type { IMDFProperties } from '../model/IMDF.model'

export type SnapType = 'vertex' | 'edge' | 'display_point' | 'none'

export interface SnapResult {
  latLng: L.LatLng
  snapType: SnapType
  label: string
  distancePx: number
  targetFeatureId?: string
}

const METERS_PER_DEG_LAT = 110852.0
const METERS_PER_DEG_LNG = 109630.0

/**
 * Tính khoảng cách hình học ngắn nhất từ 1 điểm P đến đoạn thẳng AB trên pixel màn hình
 */
function projectPointOnSegmentPx(
  pPx: L.Point,
  aPx: L.Point,
  bPx: L.Point
): { closestPx: L.Point; t: number; distance: number } {
  const dx = bPx.x - aPx.x
  const dy = bPx.y - aPx.y
  const segLenSq = dx * dx + dy * dy

  if (segLenSq === 0) {
    return { closestPx: aPx, t: 0, distance: pPx.distanceTo(aPx) }
  }

  const t = Math.max(0, Math.min(1, ((pPx.x - aPx.x) * dx + (pPx.y - aPx.y) * dy) / segLenSq))
  const closestPx = new L.Point(aPx.x + t * dx, aPx.y + t * dy)
  return { closestPx, t, distance: pPx.distanceTo(closestPx) }
}

/**
 * Trích xuất tất cả các đỉnh (vertices) và đoạn thẳng (edges) từ GeoJSON Geometry
 */
export function extractVerticesAndEdges(geometry: Geometry): {
  vertices: [number, number][]
  edges: [[number, number], [number, number]][]
} {
  const vertices: [number, number][] = []
  const edges: [[number, number], [number, number]][] = []

  const addRing = (ring: [number, number][]) => {
    for (let i = 0; i < ring.length; i++) {
      vertices.push(ring[i])
      if (i > 0) {
        edges.push([ring[i - 1], ring[i]])
      }
    }
  }

  if (geometry.type === 'Point') {
    vertices.push(geometry.coordinates as [number, number])
  } else if (geometry.type === 'LineString') {
    addRing(geometry.coordinates as [number, number][])
  } else if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring) => addRing(ring as [number, number][]))
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => addRing(ring as [number, number][]))
    })
  }

  return { vertices, edges }
}

/**
 * Tìm điểm bắt dính (Snapping) gần nhất:
 * 1. Ưu tiên Vertex Snapping (Đỉnh)
 * 2. Sau đó đến Edge Snapping (Cạnh / Ranh giới)
 */
export function findSnapTarget(
  mouseLatLng: L.LatLng,
  map: L.Map,
  features: Feature<Geometry, IMDFProperties>[],
  activeDrawingCoords: [number, number][] = [],
  tolerancePx = 18
): SnapResult {
  const mousePx = map.latLngToLayerPoint(mouseLatLng)
  let bestVertexSnap: SnapResult | null = null
  let bestEdgeSnap: SnapResult | null = null

  // 1. Kiểm tra các đỉnh của nét vẽ đang thực hiện
  activeDrawingCoords.forEach((coord, idx) => {
    const vLatLng = L.latLng(coord[1], coord[0])
    const vPx = map.latLngToLayerPoint(vLatLng)
    const distPx = mousePx.distanceTo(vPx)

    if (distPx < tolerancePx && (!bestVertexSnap || distPx < bestVertexSnap.distancePx)) {
      bestVertexSnap = {
        latLng: vLatLng,
        snapType: 'vertex',
        label: `Đỉnh nét vẽ #${idx + 1}`,
        distancePx: distPx,
      }
    }
  })

  // 2. Quét qua tất cả features trên bản đồ
  for (const f of features) {
    if (!f.geometry) continue
    const { vertices, edges } = extractVerticesAndEdges(f.geometry)
    const featName = f.properties?.name || f.properties?.feature_type || 'đối tượng'

    // a. Vertex snapping
    for (const v of vertices) {
      const vLatLng = L.latLng(v[1], v[0])
      const vPx = map.latLngToLayerPoint(vLatLng)
      const distPx = mousePx.distanceTo(vPx)

      if (distPx < tolerancePx && (!bestVertexSnap || distPx < bestVertexSnap.distancePx)) {
        bestVertexSnap = {
          latLng: vLatLng,
          snapType: 'vertex',
          label: `Đỉnh: ${featName}`,
          distancePx: distPx,
          targetFeatureId: f.properties?.id,
        }
      }
    }

    // b. Display point snapping
    if (f.properties?.display_point) {
      const dp = f.properties.display_point
      const dpLatLng = L.latLng(dp[1], dp[0])
      const dpPx = map.latLngToLayerPoint(dpLatLng)
      const distPx = mousePx.distanceTo(dpPx)

      if (distPx < tolerancePx && (!bestVertexSnap || distPx < bestVertexSnap.distancePx)) {
        bestVertexSnap = {
          latLng: dpLatLng,
          snapType: 'display_point',
          label: `Tâm hiển thị: ${featName}`,
          distancePx: distPx,
          targetFeatureId: f.properties?.id,
        }
      }
    }

    // c. Edge snapping (chỉ quét nếu chưa tìm thấy vertex rất gần)
    if (!bestVertexSnap || bestVertexSnap.distancePx > 8) {
      for (const [a, b] of edges) {
        const aLatLng = L.latLng(a[1], a[0])
        const bLatLng = L.latLng(b[1], b[0])
        const aPx = map.latLngToLayerPoint(aLatLng)
        const bPx = map.latLngToLayerPoint(bLatLng)

        const { closestPx, distance } = projectPointOnSegmentPx(mousePx, aPx, bPx)

        if (distance < tolerancePx && (!bestEdgeSnap || distance < bestEdgeSnap.distancePx)) {
          const snappedLatLng = map.layerPointToLatLng(closestPx)
          bestEdgeSnap = {
            latLng: snappedLatLng,
            snapType: 'edge',
            label: `Cạnh: ${featName}`,
            distancePx: distance,
            targetFeatureId: f.properties?.id,
          }
        }
      }
    }
  }

  // Ưu tiên vertex snapping trước edge snapping
  if (bestVertexSnap) return bestVertexSnap
  if (bestEdgeSnap) return bestEdgeSnap

  return {
    latLng: mouseLatLng,
    snapType: 'none',
    label: '',
    distancePx: Infinity,
  }
}

/**
 * Tính diện tích xấp xỉ theo mét vuông cho danh sách tọa độ Polygon [lng, lat][]
 */
export function calculatePolygonAreaSqm(coords: [number, number][]): number {
  if (coords.length < 3) return 0
  let areaDeg = 0
  const n = coords.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    areaDeg += coords[i][0] * coords[j][1]
    areaDeg -= coords[j][0] * coords[i][1]
  }
  areaDeg = Math.abs(areaDeg) / 2.0
  return areaDeg * METERS_PER_DEG_LAT * METERS_PER_DEG_LNG
}

/**
 * Tính tổng độ dài đường vẽ theo mét
 */
export function calculatePolylineLengthMeters(coords: [number, number][]): number {
  if (coords.length < 2) return 0
  let totalMeters = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dLat = (lat2 - lat1) * METERS_PER_DEG_LAT
    const dLng = (lng2 - lng1) * METERS_PER_DEG_LNG
    totalMeters += Math.sqrt(dLat * dLat + dLng * dLng)
  }
  return totalMeters
}
