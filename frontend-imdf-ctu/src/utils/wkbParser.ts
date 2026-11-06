/**
 * Utility: Chuyển đổi WKB Hex string từ backend → tọa độ [lng, lat]
 *
 * Backend (JTS WKBWriter) trả về WKB dạng hex.
 * WKB Point layout (Big Endian, byteOrder=0x00):
 *   [1] byte order (00=big, 01=little)
 *   [4] geometry type (00000001 = Point)
 *   [8] X (double, big-endian)
 *   [8] Y (double, big-endian)
 *
 * WKB LineString layout:
 *   [1] byte order
 *   [4] geometry type (00000002 = LineString)
 *   [4] numPoints
 *   [numPoints * 16] X, Y pairs
 */

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function readDouble(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, bytes[offset + i])
  }
  return new DataView(buf).getFloat64(0, littleEndian)
}

function readUint32(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4)
  return view.getUint32(0, littleEndian)
}

/**
 * Chuyển WKB Hex Point → [lng, lat]
 * Trả về null nếu parse thất bại
 */
export function wkbHexToPoint(hex: string): [number, number] | null {
  try {
    if (!hex) return null
    let cleanHex = hex.trim()
    if (cleanHex.startsWith('0x') || cleanHex.startsWith('0X')) {
      cleanHex = cleanHex.substring(2)
    }
    if (cleanHex.length < 42) return null
    const bytes = hexToBytes(cleanHex)
    const littleEndian = bytes[0] === 1
    // bytes[1..4] = geom type (bỏ qua)
    // EWKB có thể có SRID flag (bit 0x20000000)
    const rawType = readUint32(bytes, 1, littleEndian)
    const geomType = rawType & 0xffff // strip SRID flag
    if (geomType !== 1) return null // không phải Point

    // Kiểm tra SRID flag để xác định offset
    const hasSRID = (rawType & 0x20000000) !== 0
    const xOffset = hasSRID ? 13 : 5 // 1(byteOrder)+4(type)+4(SRID) hoặc 1+4

    if (xOffset + 16 > bytes.length) return null
    const x = readDouble(bytes, xOffset, littleEndian) // longitude
    const y = readDouble(bytes, xOffset + 8, littleEndian) // latitude
    return [x, y]
  } catch {
    return null
  }
}

/**
 * Chuyển WKB Hex LineString → mảng [lng, lat][]
 * Trả về [] nếu parse thất bại
 */
export function wkbHexToLineString(hex: string): [number, number][] {
  try {
    if (!hex) return []
    let cleanHex = hex.trim()
    if (cleanHex.startsWith('0x') || cleanHex.startsWith('0X')) {
      cleanHex = cleanHex.substring(2)
    }
    if (cleanHex.length < 50) return []
    const bytes = hexToBytes(cleanHex)
    const littleEndian = bytes[0] === 1

    const rawType = readUint32(bytes, 1, littleEndian)
    const geomType = rawType & 0xffff
    if (geomType !== 2) return [] // không phải LineString

    const hasSRID = (rawType & 0x20000000) !== 0
    const numPointsOffset = hasSRID ? 9 : 5
    if (numPointsOffset + 4 > bytes.length) return []
    const numPoints = readUint32(bytes, numPointsOffset, littleEndian)
    const coordsOffset = numPointsOffset + 4

    const coords: [number, number][] = []
    for (let i = 0; i < numPoints; i++) {
      if (coordsOffset + i * 16 + 16 > bytes.length) break
      const x = readDouble(bytes, coordsOffset + i * 16, littleEndian)
      const y = readDouble(bytes, coordsOffset + i * 16 + 8, littleEndian)
      coords.push([x, y])
    }
    return coords
  } catch {
    return []
  }
}
