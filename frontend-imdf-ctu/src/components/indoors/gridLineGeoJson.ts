import type { Feature, FeatureCollection, LineString, MultiLineString } from 'geojson'
import type { GridLineResponse } from '../../model/GridLine.model'

// Màu đường lưới trên bản đồ (dùng chung cho map và sidebar)
export const GRID_LINE_COLOR = '#0891b2'

type LineGeometry = LineString | MultiLineString

export interface GridLineProperties {
  id: number
  gridLineId: string
  category: string
  isOneWay: boolean
}

// ---------- Bộ đọc WKB (hex) ----------
// geom từ backend là chuỗi hex WKB, ví dụ: 0000000002 00000002 405A71... (big-endian, LineString, 2 điểm)
class WkbReader {
  private view: DataView
  private offset = 0
  private little = false

  constructor(bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  readByteOrder() {
    // 0 = big-endian (XDR), 1 = little-endian (NDR)
    this.little = this.view.getUint8(this.offset++) === 1
  }

  readUint32() {
    const value = this.view.getUint32(this.offset, this.little)
    this.offset += 4
    return value
  }

  readFloat64() {
    const value = this.view.getFloat64(this.offset, this.little)
    this.offset += 8
    return value
  }
}

// Chuyển chuỗi hex thành Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim()
  if (clean.length % 2 !== 0 || /[^0-9a-f]/i.test(clean)) {
    throw new Error('Chuỗi WKB hex không hợp lệ')
  }
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

// Ham doc WKB va tra ve LineString hoac MultiLineString. Neu khong doc duoc thi tra ve null.
function readGeometry(reader: WkbReader): LineGeometry {
  reader.readByteOrder()
  const rawType = reader.readUint32()

  // Hỗ trợ cả EWKB (cờ Z/M/SRID) và ISO WKB (1002, 2002, 3002...)
  const code = rawType & 0x0fffffff
  const baseType = code % 1000
  const dimension = Math.floor(code / 1000)
  const hasZ = (rawType & 0x80000000) !== 0 || dimension === 1 || dimension === 3
  const hasM = (rawType & 0x40000000) !== 0 || dimension === 2 || dimension === 3
  if ((rawType & 0x20000000) !== 0) reader.readUint32() // bỏ qua SRID

  const readPoint = (): number[] => {
    const x = reader.readFloat64() // longitude
    const y = reader.readFloat64() // latitude
    if (hasZ) reader.readFloat64()
    if (hasM) reader.readFloat64()
    return [x, y]
  }

  const readLine = (): number[][] => {
    const count = reader.readUint32()
    const coordinates: number[][] = []
    for (let i = 0; i < count; i++) coordinates.push(readPoint())
    return coordinates
  }

  if (baseType === 2) {
    return { type: 'LineString', coordinates: readLine() }
  }

  if (baseType === 5) {
    const count = reader.readUint32()
    const lines: number[][][] = []
    for (let i = 0; i < count; i++) {
      const line = readGeometry(reader)
      if (line.type !== 'LineString')
        throw new Error('MultiLineString chứa phần tử không phải LineString')
      lines.push(line.coordinates)
    }
    return { type: 'MultiLineString', coordinates: lines }
  }

  throw new Error(`Kiểu geometry WKB chưa được hỗ trợ: ${baseType}`)
}

export function wkbHexToGeometry(hex: string): LineGeometry | null {
  try {
    return readGeometry(new WkbReader(hexToBytes(hex)))
  } catch (error) {
    console.warn('Không đọc được geom:', error)
    return null
  }
}

// ---------- Chuyển danh sách grid line thành GeoJSON để vẽ lên Leaflet ----------
export function gridLinesToFeatureCollection(
  gridLines: GridLineResponse[]
): FeatureCollection<LineGeometry, GridLineProperties> {
  const features: Feature<LineGeometry, GridLineProperties>[] = []

  for (const item of gridLines) {
    const geometry = wkbHexToGeometry(item.geom)
    if (!geometry) continue

    features.push({
      type: 'Feature',
      id: item.id,
      geometry,
      properties: {
        id: item.id,
        gridLineId: item.gridLineId,
        category: item.category,
        isOneWay: item.isOneWay,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
