/**
 * Chuyển tọa độ [lng, lat] → WKB Hex Point (Little Endian, SRID=4326)
 * Định dạng PostGIS Native EWKB: 01 (Little Endian) + 01000020 (Point | SRID flag) + E6100000 (SRID 4326) + X(8bytes) + Y(8bytes)
 */
export function pointToWkbHex(lng: number, lat: number): string {
  const buf = new ArrayBuffer(25) // 1 + 4 + 4 + 8 + 8
  const view = new DataView(buf)

  let offset = 0
  // byte order: 01 = little endian (NDR)
  view.setUint8(offset, 0x01); offset += 1
  // geometry type: 0x20000001 (Point with SRID flag), little endian
  view.setUint32(offset, 0x20000001, true); offset += 4
  // SRID: 4326 = 0x000010E6, little endian
  view.setUint32(offset, 4326, true); offset += 4
  // X = longitude (little endian)
  view.setFloat64(offset, lng, true); offset += 8
  // Y = latitude (little endian)
  view.setFloat64(offset, lat, true); offset += 8

  const bytes = new Uint8Array(buf)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

/**
 * Chuyển mảng tọa độ [lng, lat][] → WKB Hex LineString (Little Endian, SRID=4326)
 */
export function lineStringToWkbHex(coords: [number, number][]): string {
  const n = coords.length
  // 1 + 4 + 4 + 4 + n*16
  const buf = new ArrayBuffer(1 + 4 + 4 + 4 + n * 16)
  const view = new DataView(buf)

  let offset = 0
  // byte order: 01 = little endian (NDR)
  view.setUint8(offset, 0x01); offset += 1
  // LineString with SRID flag = 0x20000002, little endian
  view.setUint32(offset, 0x20000002, true); offset += 4
  // SRID: 4326, little endian
  view.setUint32(offset, 4326, true); offset += 4
  // NumPoints, little endian
  view.setUint32(offset, n, true); offset += 4

  for (const [lng, lat] of coords) {
    view.setFloat64(offset, lng, true); offset += 8
    view.setFloat64(offset, lat, true); offset += 8
  }

  const bytes = new Uint8Array(buf)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}
