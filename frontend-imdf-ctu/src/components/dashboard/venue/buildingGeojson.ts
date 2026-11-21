export type Position = [number, number]
export type LinearRing = Position[]
export type PolygonCoords = LinearRing[]
export type MultiPolygonCoords = PolygonCoords[]

export interface PointGeometry {
  type: 'Point'
  coordinates: Position
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: MultiPolygonCoords
}

export interface ParsedBuildingGeoJson {
  /** feature.geometry đã chuẩn hóa về MultiPolygon, đưa thẳng vào request */
  geometry: MultiPolygonGeometry
  /** Điểm nằm bên trong tòa nhà, dùng làm displayPoint */
  displayPoint: PointGeometry
  polygonCount: number
  ringCount: number
  vertexCount: number
  /** Tên gợi ý lấy từ properties của feature (name:vi hoặc name) */
  suggestedName: string
  /** Số feature Polygon/MultiPolygon trong file (chỉ feature đầu tiên được dùng) */
  featureCount: number
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const round7 = (n: number) => Math.round(n * 1e7) / 1e7

function toPosition(val: unknown, path: string): Position {
  if (
    !Array.isArray(val) ||
    val.length < 2 ||
    typeof val[0] !== 'number' ||
    typeof val[1] !== 'number' ||
    !Number.isFinite(val[0]) ||
    !Number.isFinite(val[1])
  ) {
    throw new Error(`Tọa độ không hợp lệ tại ${path}`)
  }
  const lng = val[0] as number
  const lat = val[1] as number
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
    throw new Error(`Tọa độ vượt phạm vi [kinh độ, vĩ độ] tại ${path}`)
  }
  return [lng, lat] // bỏ độ cao nếu có
}

function toRing(val: unknown, path: string): LinearRing {
  if (!Array.isArray(val)) throw new Error(`Vòng tọa độ không hợp lệ tại ${path}`)
  const ring = val.map((p, i) => toPosition(p, `${path}[${i}]`))
  if (ring.length === 0) throw new Error(`Vòng tọa độ rỗng tại ${path}`)

  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]) // tự khép kín

  if (ring.length < 4) throw new Error(`Vòng tọa độ cần ít nhất 3 đỉnh khác nhau tại ${path}`)
  return ring
}

function toPolygon(val: unknown, path: string): PolygonCoords {
  if (!Array.isArray(val) || val.length === 0) {
    throw new Error(`Polygon không hợp lệ tại ${path}`)
  }
  return val.map((ring, i) => toRing(ring, `${path}[${i}]`))
}

function normalizeGeometry(geometry: Record<string, unknown>): MultiPolygonCoords {
  const { type, coordinates } = geometry
  if (type === 'Polygon') return [toPolygon(coordinates, 'coordinates')]
  if (type === 'MultiPolygon') {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throw new Error('MultiPolygon không có tọa độ')
    }
    return coordinates.map((poly, i) => toPolygon(poly, `coordinates[${i}]`))
  }
  throw new Error(`Hình học phải là Polygon hoặc MultiPolygon (file đang là ${String(type)})`)
}

const isAreaGeometry = (g: unknown): g is Record<string, unknown> =>
  isObject(g) && (g.type === 'Polygon' || g.type === 'MultiPolygon')

function findGeometry(root: unknown): {
  geometry: Record<string, unknown>
  properties: Record<string, unknown>
  featureCount: number
} {
  if (!isObject(root)) throw new Error('GeoJSON phải là một đối tượng JSON')

  if (root.type === 'FeatureCollection') {
    if (!Array.isArray(root.features) || root.features.length === 0) {
      throw new Error('FeatureCollection không có feature nào')
    }
    const candidates = root.features.filter(
      (f): f is Record<string, unknown> => isObject(f) && isAreaGeometry(f.geometry)
    )
    if (candidates.length === 0) {
      throw new Error('Không tìm thấy feature có geometry Polygon/MultiPolygon')
    }
    const first = candidates[0]
    return {
      geometry: first.geometry as Record<string, unknown>,
      properties: isObject(first.properties) ? first.properties : {},
      featureCount: candidates.length,
    }
  }

  if (root.type === 'Feature') {
    if (!isAreaGeometry(root.geometry)) {
      throw new Error('Feature phải có geometry Polygon hoặc MultiPolygon')
    }
    return {
      geometry: root.geometry,
      properties: isObject(root.properties) ? root.properties : {},
      featureCount: 1,
    }
  }

  if (isAreaGeometry(root)) return { geometry: root, properties: {}, featureCount: 1 }

  throw new Error('Không phải GeoJSON hợp lệ (cần FeatureCollection, Feature hoặc Geometry)')
}

/** Tìm một điểm nằm trong tòa nhà (kể cả tòa nhà lõm hoặc có lỗ) bằng đường quét ngang. */
function pointOnSurface(coords: MultiPolygonCoords): Position {
  const signedArea = (ring: LinearRing) => {
    let a = 0
    for (let i = 0; i < ring.length - 1; i++) {
      a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    }
    return a / 2
  }

  // Chọn polygon có vòng ngoài lớn nhất
  let best = coords[0]
  let bestArea = Math.abs(signedArea(best[0]))
  for (const poly of coords) {
    const area = Math.abs(signedArea(poly[0]))
    if (area > bestArea) {
      best = poly
      bestArea = area
    }
  }

  // Trọng tâm vòng ngoài
  const outer = best[0]
  const area = signedArea(outer)
  let cx = 0
  let cy = 0
  if (Math.abs(area) > 1e-18) {
    for (let i = 0; i < outer.length - 1; i++) {
      const cross = outer[i][0] * outer[i + 1][1] - outer[i + 1][0] * outer[i][1]
      cx += (outer[i][0] + outer[i + 1][0]) * cross
      cy += (outer[i][1] + outer[i + 1][1]) * cross
    }
    cx /= 6 * area
    cy /= 6 * area
  } else {
    cx = outer.reduce((s, p) => s + p[0], 0) / outer.length
    cy = outer.reduce((s, p) => s + p[1], 0) / outer.length
  }

  // Quét ngang tại y = cy, lấy đoạn nằm trong dài nhất (quy tắc chẵn-lẻ, có tính lỗ)
  const xs: number[] = []
  for (const ring of best) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i]
      const [x2, y2] = ring[i + 1]
      if (y1 > cy !== y2 > cy) xs.push(x1 + ((cy - y1) * (x2 - x1)) / (y2 - y1))
    }
  }
  xs.sort((a, b) => a - b)

  let bestLen = -1
  let midX = cx
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const len = xs[i + 1] - xs[i]
    if (len > bestLen) {
      bestLen = len
      midX = (xs[i] + xs[i + 1]) / 2
    }
  }

  return [round7(midX), round7(cy)]
}

/**
 * Đọc nội dung file GeoJSON, lấy feature.geometry, kiểm tra và chuẩn hóa.
 * Ném Error với thông báo tiếng Việt nếu dữ liệu không hợp lệ.
 */
export function parseBuildingGeoJson(text: string): ParsedBuildingGeoJson {
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    throw new Error('Nội dung không phải JSON hợp lệ')
  }

  const { geometry, properties, featureCount } = findGeometry(root)
  const coordinates = normalizeGeometry(geometry)

  const nameVi = properties['name:vi']
  const name = properties['name']
  const suggestedName =
    typeof nameVi === 'string' && nameVi.trim()
      ? nameVi.trim()
      : typeof name === 'string'
        ? name.trim()
        : ''

  let ringCount = 0
  let vertexCount = 0
  for (const poly of coordinates) {
    ringCount += poly.length
    for (const ring of poly) vertexCount += ring.length
  }

  return {
    geometry: { type: 'MultiPolygon', coordinates },
    displayPoint: { type: 'Point', coordinates: pointOnSurface(coordinates) },
    polygonCount: coordinates.length,
    ringCount,
    vertexCount,
    suggestedName,
    featureCount,
  }
}

/* ------------------------------------------------------------------ */
/* Dùng cho Venue: giữ nguyên loại hình học (Polygon hoặc MultiPolygon) */
/* ------------------------------------------------------------------ */

export interface PolygonGeometry {
  type: 'Polygon'
  coordinates: PolygonCoords
}

export type AreaGeometry = PolygonGeometry | MultiPolygonGeometry

export interface ParsedAreaGeoJson {
  /** feature.geometry đã kiểm tra, giữ nguyên loại Polygon hoặc MultiPolygon */
  geometry: AreaGeometry
  polygonCount: number
  ringCount: number
  vertexCount: number
  suggestedName: string
  featureCount: number
}

/**
 * Đọc nội dung file GeoJSON, lấy feature.geometry, kiểm tra tọa độ nhưng KHÔNG đổi loại hình học.
 * Ném Error với thông báo tiếng Việt nếu dữ liệu không hợp lệ.
 */
export function parseAreaGeoJson(text: string): ParsedAreaGeoJson {
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    throw new Error('Nội dung không phải JSON hợp lệ')
  }

  const { geometry, properties, featureCount } = findGeometry(root)

  let result: AreaGeometry
  let polygons: MultiPolygonCoords
  if (geometry.type === 'Polygon') {
    const polygon = toPolygon(geometry.coordinates, 'coordinates')
    result = { type: 'Polygon', coordinates: polygon }
    polygons = [polygon]
  } else {
    polygons = normalizeGeometry(geometry)
    result = { type: 'MultiPolygon', coordinates: polygons }
  }

  const nameVi = properties['name:vi']
  const name = properties['name']
  const suggestedName =
    typeof nameVi === 'string' && nameVi.trim()
      ? nameVi.trim()
      : typeof name === 'string'
        ? name.trim()
        : ''

  let ringCount = 0
  let vertexCount = 0
  for (const poly of polygons) {
    ringCount += poly.length
    for (const ring of poly) vertexCount += ring.length
  }

  return {
    geometry: result,
    polygonCount: polygons.length,
    ringCount,
    vertexCount,
    suggestedName,
    featureCount,
  }
}
