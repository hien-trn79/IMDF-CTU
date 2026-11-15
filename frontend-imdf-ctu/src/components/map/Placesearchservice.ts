// Tìm địa điểm ngoài dữ liệu trong nhà (Bến Ninh Kiều, quán cà phê, trường học...)
// bằng Photon (https://photon.komoot.io): dữ liệu OpenStreetMap, miễn phí, không cần API key,
// hỗ trợ gõ đến đâu gợi ý đến đó. API công khai chỉ nên dùng ở mức vừa phải
// (~1 request/giây), nên nơi gọi phải debounce và huỷ request cũ.

import type { SearchResultItem } from '../../utils/searchUtils'

const PHOTON_URL = 'https://photon.komoot.io/api/'

// Ưu tiên kết quả quanh Cần Thơ (Khu II ĐH Cần Thơ) nhưng vẫn tìm được trên toàn Việt Nam
const BIAS_LAT = 10.03031
const BIAS_LON = 105.76843
const VIETNAM_BBOX = '102.1,8.4,109.6,23.4' // minLon,minLat,maxLon,maxLat

// Nhãn tiếng Việt cho các loại địa điểm phổ biến (osm_value)
const TYPE_LABELS: Record<string, string> = {
  restaurant: 'Nhà hàng',
  cafe: 'Quán cà phê',
  fast_food: 'Đồ ăn nhanh',
  bar: 'Quán bar',
  pub: 'Quán nhậu',
  school: 'Trường học',
  university: 'Đại học',
  college: 'Cao đẳng',
  kindergarten: 'Mầm non',
  hospital: 'Bệnh viện',
  clinic: 'Phòng khám',
  pharmacy: 'Nhà thuốc',
  bank: 'Ngân hàng',
  atm: 'ATM',
  fuel: 'Trạm xăng',
  parking: 'Bãi đậu xe',
  bus_station: 'Bến xe',
  bus_stop: 'Trạm xe buýt',
  ferry_terminal: 'Bến tàu / phà',
  marketplace: 'Chợ',
  supermarket: 'Siêu thị',
  mall: 'Trung tâm thương mại',
  convenience: 'Cửa hàng tiện lợi',
  hotel: 'Khách sạn',
  hostel: 'Nhà nghỉ',
  guest_house: 'Nhà khách',
  park: 'Công viên',
  garden: 'Vườn',
  museum: 'Bảo tàng',
  attraction: 'Điểm tham quan',
  viewpoint: 'Điểm ngắm cảnh',
  place_of_worship: 'Nơi thờ tự',
  police: 'Công an',
  post_office: 'Bưu điện',
  library: 'Thư viện',
  cinema: 'Rạp chiếu phim',
  stadium: 'Sân vận động',
  sports_centre: 'Trung tâm thể thao',
  townhall: 'Trụ sở UBND',
  government: 'Cơ quan nhà nước',
  pier: 'Cầu tàu',
  bridge: 'Cầu',
  city: 'Thành phố',
  town: 'Thị xã / thị trấn',
  village: 'Làng',
  suburb: 'Khu vực',
  neighbourhood: 'Khu dân cư',
  district: 'Quận / huyện',
  residential: 'Đường',
  primary: 'Đường',
  secondary: 'Đường',
  tertiary: 'Đường',
  house: 'Nhà',
}

// Cache kết quả theo từ khoá để không gọi lại khi người dùng gõ xoá gõ lại
const cache = new Map<string, SearchResultItem[]>()
const CACHE_LIMIT = 50

const unique = (parts: (string | undefined)[]) => {
  const seen = new Set<string>()
  return parts.filter((p): p is string => {
    if (!p || seen.has(p)) return false
    seen.add(p)
    return true
  })
}

// Chuyển 1 feature của Photon thành mục kết quả tìm kiếm
export function photonFeatureToItem(feature: any): SearchResultItem | null {
  const p = feature?.properties ?? {}
  const coords = feature?.geometry?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null

  const [lon, lat] = coords as [number, number]
  const street = [p.housenumber, p.street].filter(Boolean).join(' ')
  const title: string = p.name || street
  if (!title) return null

  const address = unique([
    p.name ? street : undefined,
    p.locality,
    p.district,
    p.city ?? p.county,
    p.state,
  ]).join(', ')

  const typeLabel = TYPE_LABELS[p.osm_value as string] ?? 'Địa điểm'

  return {
    id: `place-${p.osm_type ?? ''}${p.osm_id ?? `${lat},${lon}`}`,
    title,
    subtitle: unique([typeLabel, address]).join(' · '),
    category: 'place',
    coordinates: [lat, lon],
    address,
    typeLabel,
    rawProperties: p,
  }
}

export async function searchExternalPlaces(
  query: string,
  signal: AbortSignal,
  limit = 6
): Promise<SearchResultItem[]> {
  const q = query.trim()
  const key = q.toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const params = new URLSearchParams({
    q,
    limit: String(limit),
    lat: String(BIAS_LAT),
    lon: String(BIAS_LON),
    zoom: '11',
    location_bias_scale: '0.3',
    bbox: VIETNAM_BBOX,
  })

  const res = await fetch(`${PHOTON_URL}?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`)

  const json = await res.json()
  const items: SearchResultItem[] = (json?.features ?? [])
    .map(photonFeatureToItem)
    .filter((i: SearchResultItem | null): i is SearchResultItem => i !== null)

  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(key, items)
  return items
}
