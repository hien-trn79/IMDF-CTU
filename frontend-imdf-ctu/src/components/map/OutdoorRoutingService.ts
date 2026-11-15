import type { SearchResultItem } from '../../utils/searchUtils'

export type LatLng = [number, number] // phu hop voi quy uoc DestinationItem

// Tính theo xe hơi
const OSRM_URL = 'https://routing.openstreetmap.de/routed-car/route/v1/driving'
// const OSRM_URL = 'https://routing.openstreetmap.de/routed-bike/route/v1/driving' => tính theo xe đạp
// Cong chinh truong CNTT
export const MAIN_ENTRANCE_HEX = '0000000001405A71363E2F0AAE40240FC5A6800F3F'

export const MAIN_ENTRANCE_COORDINATE: LatLng = [10.030805, 105.768936]

export interface RouteStep {
  instruction: string
  distance: number // don vi tinh (m)
  location: LatLng
}

export interface RouteData {
  distance: number // don vi tinh (m)
  duration: number // don vi tinh (s)
  distanceText: string
  durationText: string
  coordinates: LatLng[]
  steps: RouteStep[]
}

// Thuc hien cho diem dau & diem cuoi cua outdoor routing service
export const isIndoor = (item: SearchResultItem): boolean => item.category !== 'place'

export const toOutdoorPoint = (item: SearchResultItem): LatLng =>
  isIndoor(item) ? MAIN_ENTRANCE_COORDINATE : (item.coordinates as LatLng)

export const createMyLocationItem = (position: LatLng): SearchResultItem => ({
  id: 'my-location',
  title: 'Vị trí của tôi',
  subtitle: 'Vị trí GPS hiện tại của bạn',
  category: 'place',
  coordinates: position,
  address: 'Vị trí GPS hiện tại của bạn',
  typeLabel: 'Vị trí',
  rawProperties: {},
})

// Định dạng
const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`

const formatDuration = (s: number) => {
  const minutes = Math.round(s / 60)

  if (minutes < 1) return 'dưới 1 phút'
  if (minutes < 60) return `${minutes} phút`
  return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`
}

const TURN: Record<string, string> = {
  'sharp left': 'Rẽ trái gấp',
  left: 'Rẽ trái',
  'slight left': 'Chếch sang trái',
  straight: 'Đi thẳng',
  'slight right': 'Chếch sang phải',
  right: 'Rẽ phải',
  'sharp right': 'Rẽ phải gấp',
  uturn: 'Quay đầu',
}

// Chuyển 1 bước của OSRM thành câu hướng dẫn Tiếng Việt
function toInstruction(step: any): string {
  const { type, modifier } = step.maneuver

  const name: string = step.name
  if (type === 'depart') {
    return `Bắt đầu đi ${name ? `tại ${name}` : 'Xuất phát'}`
  } else if (type === 'arrive') {
    return `Đã đến nơi`
  }

  const goStraight = !modifier || modifier === 'straight'
  if ((type === 'continue' || type === 'new name') && goStraight)
    return name ? `Đi tiếp trên ${name}` : 'Đi tiếp'
  return `${TURN[modifier] ?? 'Đi tiếp'}${name ? ` vào ${name}` : ''}`
}

// Bắt đầu gọi OSRM API để lấy dữ liệu tuyến đường
export async function fetchOutdoorRoute(
  from: LatLng,
  to: LatLng,
  signal: AbortSignal
): Promise<RouteData> {
  if ([...from, ...to].some((n) => !Number.isFinite(n))) throw new Error('Toạ độ không hợp lệ')

  // OSRM dùng thứ tự lng,lat
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`
  // geometries=geojson: nếu thiếu, OSRM trả đường đi dạng chuỗi polyline (không có .coordinates)
  const response = await fetch(
    `${OSRM_URL}/${coords}?overview=full&geometries=geojson&steps=true`,
    { signal }
  )
  const data = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new Error(`OSRM ${response.status} ${data.code ?? ''}: ${data.message ?? ''}`)

  // OSRM trả về "routes" (số nhiều)
  const route = data.routes?.[0]

  if (data.code !== 'Ok' || !route)
    throw new Error(`Không tìm thấy tuyến đường bên ngoài: ${data.code} ${data.message ?? ''}`)

  return {
    distance: route.distance,
    duration: route.duration,
    distanceText: formatDistance(route.distance),
    durationText: formatDuration(route.duration),
    coordinates: route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]),
    steps: route.legs
      .flatMap((leg: any) => leg.steps)
      .map((s: any) => ({
        instruction: toInstruction(s),
        distance: Math.round(s.distance),
        location: [s.maneuver.location[1], s.maneuver.location[0]] as LatLng,
      })),
  }
}
