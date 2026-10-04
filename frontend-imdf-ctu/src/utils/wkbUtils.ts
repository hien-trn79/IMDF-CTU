/**
 * WKB (Well-Known Binary) Hex Utilities
 * Backend trả về geom dạng WKB Hex BigEndian, không có SRID prefix trong hex.
 * Format: byte-order(1) + type(4) + numPoints(4) + [x(8) + y(8)] * numPoints
 * Trong đó x = longitude, y = latitude (EPSG:4326)
 */

function hexToDataView(hex: string): DataView {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return new DataView(bytes.buffer)
}

/**
 * Parse WKB Hex LineString → array of [lng, lat] (GeoJSON order)
 */
export function parseWKBHexToCoords(hex: string): [number, number][] {
  if (!hex) return []
  try {
    const view = hexToDataView(hex)
    const isLittle = view.getUint8(0) === 1
    const type = view.getUint32(1, isLittle)
    let offset = 5

    // Skip SRID if present (EWKB flag)
    if ((type & 0x20000000) !== 0) offset += 4

    const numPts = view.getUint32(offset, isLittle)
    offset += 4

    const points: [number, number][] = []
    for (let i = 0; i < numPts; i++) {
      const x = view.getFloat64(offset, isLittle) // longitude
      offset += 8
      const y = view.getFloat64(offset, isLittle) // latitude
      offset += 8
      points.push([x, y])
    }
    return points
  } catch {
    return []
  }
}

/**
 * Convert WKB Hex → [lat, lng] pairs for react-leaflet Polyline
 */
export function parseWKBHexToLatLngs(hex: string): [number, number][] {
  return parseWKBHexToCoords(hex).map(([lng, lat]) => [lat, lng])
}

/**
 * Convert array of [lng, lat] coordinates → WKB Hex BigEndian
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export function coordsToWKBHex(points: [number, number][]): string {
  // Each point: 8 bytes x + 8 bytes y; header: 1 + 4 + 4
  const buffer = new ArrayBuffer(1 + 4 + 4 + points.length * 16)
  const view = new DataView(buffer)
  view.setUint8(0, 0) // BigEndian
  view.setUint32(1, 2, false) // type = LineString = 2
  view.setUint32(5, points.length, false)
  let offset = 9
  for (const [x, y] of points) {
    view.setFloat64(offset, x, false)
    offset += 8
    view.setFloat64(offset, y, false)
    offset += 8
  }
  return bytesToHex(new Uint8Array(buffer))
}

/**
 * Approximate length in meters of a polyline via Haversine formula
 */
export function calcPolylineLengthMeters(coords: [number, number][]): number {
  const R = 6371000
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  return total
}

/**
 * Format length in meters or km
 */
export function formatLength(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${meters.toFixed(1)} m`
}
