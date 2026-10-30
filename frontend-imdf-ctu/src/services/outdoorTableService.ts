import { authHeaders } from './authHeaders'

const post = async (table: string, payload: unknown, token?: string) => {
  const endpoint = table === 'level' ? 'levels' : `${table}s`
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: { ...authHeaders(token ?? ''), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`Tạo ${table} thất bại (HTTP ${response.status}).`)
  return response.json()
}

export const outdoorTableService = {
  create(table: string, feature: any, _levelId: number, token?: string) {
    const properties = feature.properties ?? {}
    const geometry = feature.geometry
    if (table === 'level') {
      return post(table, {
        geometry,
        outdoor: Boolean(properties.outdoor ?? false),
        ordinal: Number(properties.ordinal ?? 0),
        displayPoint: properties.displayPoint ?? firstPoint(geometry),
        levelCategoryId: Number(properties.levelCategoryId ?? 1),
      }, token)
    }
    if (table === 'anchor') {
      return post(table, {
        anchorName: String(properties.anchorName ?? properties.name ?? `Anchor ${Date.now()}`),
        geometry,
        featureId: numberOrNull(properties.featureId),
        unitId: numberOrNull(properties.unitId),
      }, token)
    }
    if (table === 'amenity') {
      return post(table, {
        geometry: toWkt(geometry),
        phone: String(properties.phone ?? ''),
        website: String(properties.website ?? ''),
        hours: properties.hours ?? null,
        amenityCategoryId: Number(properties.amenityCategoryId ?? 1),
        featureId: numberOrNull(properties.featureId),
      }, token)
    }
    throw new Error(`Bảng ${table} chưa được hỗ trợ.`)
  },
}

function numberOrNull(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function firstPoint(geometry: any) {
  const coordinates = geometry?.coordinates
  if (geometry?.type === 'Point') return geometry
  const point = findPoint(coordinates)
  return { type: 'Point', coordinates: point ?? [0, 0] }
}

function findPoint(value: any): [number, number] | null {
  if (!Array.isArray(value)) return null
  if (typeof value[0] === 'number' && typeof value[1] === 'number') return [value[0], value[1]]
  for (const child of value) {
    const point = findPoint(child)
    if (point) return point
  }
  return null
}

function toWkt(geometry: any): string {
  const type = String(geometry?.type ?? '').toUpperCase()
  const coordinates = geometry?.coordinates
  if (type === 'POINT') return `POINT (${coordinates[0]} ${coordinates[1]})`
  if (type === 'LINESTRING') return `LINESTRING (${coordinates.map((p: any) => `${p[0]} ${p[1]}`).join(', ')})`
  if (type === 'POLYGON') return `POLYGON (${coordinates.map((ring: any) => `(${ring.map((p: any) => `${p[0]} ${p[1]}`).join(', ')})`).join(', ')})`
  throw new Error('Amenity chỉ hỗ trợ Point, LineString hoặc Polygon.')
}
