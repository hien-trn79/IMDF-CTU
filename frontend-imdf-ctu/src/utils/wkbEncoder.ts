/**
 * Chuyển tọa độ [lng, lat] → WKB Hex Point (Big Endian, SRID=4326)
 * Định dạng EWKB: 00 20000001 [SRID=4326] [X] [Y]
 * Tương thích với JTS WKBReader mà backend đang dùng.
 *
 * NOTE: Backend dùng WKBReader.hexToBytes + wkbReader.read(bytes) 
 * với GeometryFactory(PrecisionModel, 4326).
 * WKBWriter của JTS theo mặc định KHÔNG kèm SRID, nhưng đọc được cả 2 format.
 * Để an toàn nhất, gửi EWKB (có SRID) dạng Big Endian.
 */
export function pointToWkbHex(lng: number, lat: number): string {
  // EWKB Big Endian Point với SRID=4326
  // Layout: 00 + 20000001 + 00001064 (SRID=4326) + X(8bytes) + Y(8bytes)
  // 00 = big endian
  // 20000001 = type Point | SRID_FLAG
  // 00001064 hex = 4198 decimal... no: SRID 4326 = 0x000010E6
  
  const buf = new ArrayBuffer(25) // 1 + 4 + 4 + 8 + 8
  const view = new DataView(buf)

  let offset = 0
  // byte order: 00 = big endian
  view.setUint8(offset, 0x00); offset += 1
  // geometry type: 0x20000001 = Point with SRID flag
  view.setUint32(offset, 0x20000001, false); offset += 4
  // SRID: 4326 = 0x000010E6
  view.setUint32(offset, 4326, false); offset += 4
  // X = longitude
  view.setFloat64(offset, lng, false); offset += 8
  // Y = latitude
  view.setFloat64(offset, lat, false); offset += 8

  const bytes = new Uint8Array(buf)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

/**
 * Chuyển mảng tọa độ [lng, lat][] → WKB Hex LineString (Big Endian, SRID=4326)
 */
export function lineStringToWkbHex(coords: [number, number][]): string {
  const n = coords.length
  // 1 + 4 + 4 + 4 + n*16
  const buf = new ArrayBuffer(1 + 4 + 4 + 4 + n * 16)
  const view = new DataView(buf)

  let offset = 0
  view.setUint8(offset, 0x00); offset += 1
  // LineString with SRID flag = 0x20000002
  view.setUint32(offset, 0x20000002, false); offset += 4
  view.setUint32(offset, 4326, false); offset += 4
  view.setUint32(offset, n, false); offset += 4

  for (const [lng, lat] of coords) {
    view.setFloat64(offset, lng, false); offset += 8
    view.setFloat64(offset, lat, false); offset += 8
  }

  const bytes = new Uint8Array(buf)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}
