import type { DestinationItem, RouteData, RouteStep } from '../model/Navigation.model'

// Cổng vào chính toà nhà Khoa CNTT&TT theo mã hex WKB Point được chỉ định:
// "0000000001405A71363E2F0AAE40240FC5A6800F3F"
export const MAIN_ENTRANCE_HEX = '0000000001405A71363E2F0AAE40240FC5A6800F3F'
export const MAIN_ENTRANCE_POINT: [number, number] = [10.030804827816267, 105.76893572420042] // [lat, lng]

// Tọa độ mặc định tại khuôn viên ĐH Cần Thơ Khu II (Cổng A Đường 3 Tháng 2)
export const CTU_DEFAULT_USER_LOCATION: [number, number] = [10.02985, 105.77052]

/**
 * Tính tâm (centroid / bounding box center) của geometry GeoJSON
 */
export function getGeometryCenter(geometry: any): [number, number] | null {
  if (!geometry) return null
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    return [geometry.coordinates[1], geometry.coordinates[0]] // [lat, lng]
  }

  let minLat = 90
  let maxLat = -90
  let minLng = 180
  let maxLng = -180
  let count = 0

  const scanCoords = (coords: any) => {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const lng = coords[0]
      const lat = coords[1]
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      count++
    } else {
      coords.forEach(scanCoords)
    }
  }

  scanCoords(geometry.coordinates)

  if (count > 0 && minLat <= maxLat && minLng <= maxLng) {
    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2]
  }
  return null
}

/**
 * Tính khoảng cách xấp xỉ theo mét giữa 2 tọa độ (công thức Haversine)
 */
export function calculateDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lon1] = coord1
  const [lat2, lon2] = coord2
  const R = 6371000 // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

/**
 * Format khoảng cách sang chuỗi hiển thị đẹp (m hoặc km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Format thời gian đi bộ ước tính
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes <= 1) return 'Khoảng 1 phút đi bộ'
  if (minutes < 60) return `Khoảng ${minutes} phút đi bộ`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `Khoảng ${hours} giờ ${remainingMinutes} phút đi bộ`
}

/**
 * Chuẩn hóa chuỗi tìm kiếm (loại bỏ dấu, ký tự đặc biệt, slash, dash)
 */
export function normalizeSearchString(val: string): string {
  if (!val) return ''
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[/_\-\s]+/g, '')
    .trim()
}

/**
 * Tải danh sách cửa ra vào (opening) từ GeoServer
 */
async function fetchOpenings(geoServerUrl: string): Promise<Record<string, [number, number]>> {
  const doors: Record<string, [number, number]> = {}
  try {
    const res = await fetch(
      `${geoServerUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=imdf_ctu:opening&outputFormat=application/json`
    )
    if (res.ok) {
      const d = await res.json()
      for (const f of d.features || []) {
        const coords = f.geometry?.coordinates
        if (Array.isArray(coords) && coords.length >= 2) {
          const centerLat = (coords[0][1] + coords[1][1]) / 2
          const centerLng = (coords[0][0] + coords[1][0]) / 2
          const key = f.id.replace('opening.', '').toLowerCase()
          doors[key] = [centerLat, centerLng]
        }
      }
    }
  } catch (err) {
    console.warn('Lỗi khi tải openings:', err)
  }
  return doors
}

/**
 * Tải danh sách anchors (điểm neo bên trong phòng) từ GeoServer
 */
async function fetchAnchors(geoServerUrl: string): Promise<Record<string, [number, number]>> {
  const anchors: Record<string, [number, number]> = {}
  try {
    const res = await fetch(
      `${geoServerUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=imdf_ctu:anchors&outputFormat=application/json`
    )
    if (res.ok) {
      const d = await res.json()
      for (const f of d.features || []) {
        const unitId = f.properties?.unit_id
        const coords = f.geometry?.coordinates
        if (unitId && Array.isArray(coords) && coords.length >= 2) {
          anchors[String(unitId).toLowerCase()] = [coords[1], coords[0]]
        }
      }
    }
  } catch (err) {
    console.warn('Lỗi khi tải anchors:', err)
  }
  return anchors
}

/**
 * Tải toàn bộ địa điểm, phòng học từ GeoServer WFS và liên kết với cửa ra vào / anchor
 */
export async function fetchAllSearchableLocations(
  geoServerUrl: string = '/geoserver'
): Promise<DestinationItem[]> {
  const items: DestinationItem[] = []

  // Tải đồng thời cửa và anchor
  const [doors, anchors] = await Promise.all([
    fetchOpenings(geoServerUrl),
    fetchAnchors(geoServerUrl),
  ])

  try {
    // 1. Tải danh sách phòng học (unit_4326)
    const unitUrl = `${geoServerUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=imdf_ctu:unit_4326&outputFormat=application/json`
    const unitRes = await fetch(unitUrl).catch(() => null)
    if (unitRes && unitRes.ok) {
      const unitData = await unitRes.json()
      const features = unitData.features || []
      features.forEach((f: any) => {
        const props = f.properties || {}
        const center = getGeometryCenter(f.geometry)
        if (!center) return

        const roomCode = props.room_code || props.code || ''
        const nameVi = props.name_vi || props.name || (roomCode ? `Phòng ${roomCode}` : 'Phòng học')
        const level = props.level !== undefined && props.level !== null ? String(props.level) : '0'

        // Tìm toạ độ cửa (door) tương ứng
        const rawId = f.id ? f.id.replace('unit_4326.', '').toLowerCase() : ''
        const codeKey = roomCode.replace('DI/', '').toLowerCase()

        let doorCoord: [number, number] | undefined =
          doors[`door_${rawId}`] ||
          doors[`door_${codeKey}`] ||
          doors[`door_${rawId.replace('-', '_')}`]

        // Tìm toạ độ anchor bên trong phòng
        let anchorCoord: [number, number] | undefined =
          anchors[rawId] ||
          anchors[codeKey] ||
          anchors[`bm-${codeKey}`]

        items.push({
          id: f.id || `unit_${props.fid || Math.random()}`,
          title: roomCode ? `${nameVi} (${roomCode})` : nameVi,
          subtitle: `Tầng ${level} · Khoa CNTT & TT`,
          category: 'room',
          roomCode: roomCode || undefined,
          level,
          buildingName: 'Khoa Công Nghệ Thông Tin & TT',
          address: 'Nhà CI, Khoa CNTT&TT, Khu II, Đ. 3 Tháng 2, Cần Thơ',
          coordinates: anchorCoord || center,
          geometry: f.geometry,
          doorCoordinates: doorCoord,
          anchorCoordinates: anchorCoord,
          rawProperties: props,
        })
      })
    }
  } catch (err) {
    console.warn('Lỗi khi tải layer unit_4326:', err)
  }

  try {
    // 2. Tải danh sách các toà nhà (ctu_buildings_4326)
    const bldgUrl = `${geoServerUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=imdf_ctu:ctu_buildings_4326&outputFormat=application/json`
    const bldgRes = await fetch(bldgUrl).catch(() => null)
    if (bldgRes && bldgRes.ok) {
      const bldgData = await bldgRes.json()
      const features = bldgData.features || []
      features.forEach((f: any) => {
        const props = f.properties || {}
        const name = props['name:vi'] || props.name || props['name:en']
        if (!name) return
        const center = getGeometryCenter(f.geometry)
        if (!center) return

        items.push({
          id: f.id || `bldg_${Math.random()}`,
          title: name,
          subtitle: props['name:en'] || 'Toà nhà trường ĐH Cần Thơ',
          category: 'building',
          buildingName: name,
          address: 'Khu II, Đ. 3 Tháng 2, Ninh Kiều, Cần Thơ',
          coordinates: center,
          geometry: f.geometry,
          rawProperties: props,
        })
      })
    }
  } catch (err) {
    console.warn('Lỗi khi tải layer ctu_buildings_4326:', err)
  }

  try {
    // 3. Tải danh sách tiện ích (amenity - WC, máy ATM, vv.)
    const amenityUrl = `${geoServerUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=imdf_ctu:amenity&outputFormat=application/json`
    const amenityRes = await fetch(amenityUrl).catch(() => null)
    if (amenityRes && amenityRes.ok) {
      const amenityData = await amenityRes.json()
      const features = amenityData.features || []
      features.forEach((f: any) => {
        const props = f.properties || {}
        const center = getGeometryCenter(f.geometry)
        if (!center) return

        const name = props.name_vi || props.name || props.unit_id || 'Khu tiện ích'
        items.push({
          id: f.id || `amenity_${Math.random()}`,
          title: name,
          subtitle: `Tiện ích · Tầng ${props.level || '0'}`,
          category: 'amenity',
          level: String(props.level || '0'),
          buildingName: 'Khoa Công Nghệ Thông Tin & TT',
          address: 'Khoa CNTT&TT, Khu II, Đ. 3 Tháng 2, Cần Thơ',
          coordinates: center,
          geometry: f.geometry,
          rawProperties: props,
        })
      })
    }
  } catch (err) {
    console.warn('Lỗi khi tải layer amenity:', err)
  }

  return items
}

/**
 * Tìm kiếm địa điểm và phòng học theo từ khóa:
 * Hỗ trợ tìm kiếm theo:
 * - Mã phòng (room_code): e.g. "DI/101", "101", "DI101", "DI-101", "HTTT", "CNPM"
 * - Tên tiếng Việt: "Phòng 101", "Khoa Công Nghệ Thông Tin", "Trường Kinh tế", v.v.
 */
export function searchLocations(
  query: string,
  locations: DestinationItem[]
): DestinationItem[] {
  if (!query || !query.trim()) return []

  const rawQ = query.trim().toLowerCase()
  const normQ = normalizeSearchString(query)

  const matches: Array<{ item: DestinationItem; score: number }> = []

  for (const item of locations) {
    let score = 0

    // Kiểm tra khớp mã phòng (room_code)
    if (item.roomCode) {
      const rawCode = item.roomCode.toLowerCase()
      const normCode = normalizeSearchString(item.roomCode)

      if (rawCode === rawQ || normCode === normQ) {
        score += 100
      } else if (normCode.startsWith(normQ)) {
        score += 80
      } else if (normCode.includes(normQ)) {
        score += 60
      } else if (normQ.length >= 2 && normCode.replace(/^di/, '').includes(normQ)) {
        score += 75
      }
    }

    // Kiểm tra khớp tên (title / name)
    const normTitle = normalizeSearchString(item.title)
    if (normTitle === normQ) {
      score += 90
    } else if (normTitle.startsWith(normQ)) {
      score += 50
    } else if (normTitle.includes(normQ)) {
      score += 40
    }

    // Kiểm tra khớp toà nhà / danh mục
    if (item.buildingName) {
      const normBldg = normalizeSearchString(item.buildingName)
      if (normBldg.includes(normQ)) {
        score += 30
      }
    }

    if (score > 0) {
      matches.push({ item, score })
    }
  }

  matches.sort((a, b) => b.score - a.score)
  return matches.slice(0, 15).map((m) => m.item)
}

export async function searchExternalLocations(
  query: string,
  signal?: AbortSignal
): Promise<DestinationItem[]> {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length < 3) return []

  const params = new URLSearchParams({
    q: trimmedQuery,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    'accept-language': 'vi',
    countrycodes: 'vn',
  })
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { signal, headers: { Accept: 'application/json' } }
  )
  if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}`)

  const results: Array<{
    place_id: number
    display_name: string
    lat: string
    lon: string
    type?: string
    category?: string
    address?: Record<string, string>
  }> = await response.json()

  return results
    .filter((result) => Number.isFinite(Number(result.lat)) && Number.isFinite(Number(result.lon)))
    .map((result) => {
      const address = result.address || {}
      const title =
        address.amenity ||
        address.building ||
        address.tourism ||
        address.shop ||
        address.road ||
        result.display_name.split(',')[0]
      return {
        id: `geocoding-${result.place_id}`,
        title,
        subtitle: 'Địa điểm bên ngoài · OpenStreetMap',
        category: 'custom',
        address: result.display_name,
        coordinates: [Number(result.lat), Number(result.lon)],
        source: 'geocoding',
        rawProperties: { type: result.type, category: result.category, address },
      }
    })
}

/**
 * XÂY DỰNG ĐƯỜNG NỘI TUYẾN (INDOOR CORRIDOR PATHWAY)
 * Bắt đầu BẮT BUỘC TỪ CỔNG VÀO CHÍNH:
 * "0000000001405A71363E2F0AAE40240FC5A6800F3F" [10.030804827816267, 105.76893572420042]
 * đi qua sảnh chính, hành lang trung tâm và kết nối vào cửa / tâm phòng học.
 */
function buildIndoorCorridorPath(destination: DestinationItem): [number, number][] {
  const P_ENTRANCE = MAIN_ENTRANCE_POINT // Cổng vào chính
  const P_LOBBY: [number, number] = [10.030848, 105.768988] // Sảnh chính toà nhà
  const P_JUNCTION: [number, number] = [10.030985, 105.769085] // Ngã rẽ hành lang trung tâm

  const code = (destination.roomCode || '').toUpperCase()
  const destCoords = destination.coordinates

  const indoorPath: [number, number][] = [P_ENTRANCE, P_LOBBY]

  // 1. Phân nhánh Nam (Văn phòng trường VPT, Thư viện TV)
  if (code.includes('VPT') || destination.id.includes('A1-06')) {
    indoorPath.push([10.0308368, 105.7690775], destCoords)
    return indoorPath
  }
  if (code.includes('LB') || destination.id.includes('A1-02')) {
    indoorPath.push([10.0308823, 105.7691147], destCoords)
    return indoorPath
  }

  // Đi tiếp đến ngã ba hành lang trung tâm
  indoorPath.push(P_JUNCTION)

  // 2. Phân nhánh Tây (Không gian sáng chế KGSC, Đoàn trường VPD, WC1 - WC4)
  if (code.includes('KGSC') || destination.id.includes('A1-01')) {
    indoorPath.push([10.03096, 105.76892], [10.0309758, 105.768862], destCoords)
    return indoorPath
  }
  if (code.includes('VPĐ') || destination.id.includes('A1-04')) {
    indoorPath.push([10.03101, 105.76896], [10.031038, 105.768915], destCoords)
    return indoorPath
  }
  if (code.includes('WC') || destination.title.includes('WC')) {
    indoorPath.push([10.03105, 105.76899], [10.03112, 105.76899], destCoords)
    return indoorPath
  }

  // 3. Phân nhánh Hành lang phòng học DI/101 đến DI/109
  const classroomWaypoints: Record<string, [number, number][]> = {
    'DI/101': [
      [10.031045, 105.769115],
      [10.0310278, 105.7691344], // Cửa 101
    ],
    'DI/102': [
      [10.031045, 105.769115],
      [10.031085, 105.769152],
      [10.0310691, 105.7691723], // Cửa 102
    ],
    'DI/103': [
      [10.031045, 105.769115],
      [10.031085, 105.769152],
      [10.031122, 105.769185],
      [10.0311069, 105.7692061], // Cửa 103
    ],
    'DI/104': [
      [10.031045, 105.769115],
      [10.031122, 105.769185],
      [10.03116, 105.769218],
      [10.031143, 105.769237], // Cửa 104
    ],
    'DI/105': [
      [10.031045, 105.769115],
      [10.031122, 105.769185],
      [10.03116, 105.769218],
      [10.0312, 105.769252],
      [10.0311844, 105.769272], // Cửa 105
    ],
    'DI/106': [
      [10.031045, 105.769115],
      [10.03116, 105.769218],
      [10.031238, 105.769285],
      [10.0312221, 105.7693035], // Cửa 106
    ],
    'DI/107': [
      [10.031045, 105.769115],
      [10.0312, 105.769252],
      [10.03128, 105.769322],
      [10.0312663, 105.7693416], // Cửa 107
    ],
    'DI/108': [
      [10.031045, 105.769115],
      [10.031238, 105.769285],
      [10.03132, 105.769358],
      [10.0313078, 105.7693777], // Cửa 108
    ],
    'DI/109': [
      [10.031045, 105.769115],
      [10.031238, 105.769285],
      [10.03132, 105.769358],
      [10.031368, 105.769398],
      [10.0313551, 105.7694183], // Cửa 109
    ],
  }

  // 4. Phân nhánh Hành lang các Bộ môn & Phòng 110, 111
  const officeWaypoints: Record<string, [number, number][]> = {
    'DI/110': [
      [10.03105, 105.769115],
      [10.03114, 105.769155],
      [10.0311792, 105.769148], // Cửa 110
    ],
    'DI/111': [
      [10.03105, 105.769115],
      [10.03117, 105.76913],
      [10.0312082, 105.7691125], // Cửa 111
    ],
    'DI/HTTT': [
      [10.03105, 105.769115],
      [10.03118, 105.769135],
      [10.0312473, 105.7691036], // Cửa HTTT
    ],
    'DI/CNPM': [
      [10.03105, 105.769115],
      [10.03118, 105.769135],
      [10.03125, 105.76912],
      [10.0312906, 105.769142], // Cửa CNPM
    ],
    'DI/KHMT': [
      [10.03105, 105.769115],
      [10.03125, 105.76912],
      [10.0313272, 105.7691732], // Cửa KHMT
    ],
    'DI/MTT-TT': [
      [10.03105, 105.769115],
      [10.03128, 105.76915],
      [10.0313714, 105.7692101], // Cửa MMT-TT
    ],
    'DI/TTĐPT': [
      [10.03105, 105.769115],
      [10.03132, 105.76918],
      [10.0314184, 105.7692494], // Cửa TTĐPT
    ],
    'DI/CNTT': [
      [10.03105, 105.769115],
      [10.03135, 105.7692],
      [10.031473, 105.7692925], // Cửa CNTT
    ],
  }

  if (classroomWaypoints[code]) {
    indoorPath.push(...classroomWaypoints[code])
  } else if (officeWaypoints[code]) {
    indoorPath.push(...officeWaypoints[code])
  } else {
    // Nếu có toạ độ cửa (doorCoordinates), nối qua hành lang tới cửa
    if (destination.doorCoordinates) {
      indoorPath.push([10.03105, 105.769115], destination.doorCoordinates)
    } else {
      // Nội suy hành lang gần nhất
      indoorPath.push([10.03105, 105.769115])
    }
  }

  // Kết thúc tại tâm điểm phòng / anchor
  indoorPath.push(destCoords)

  return indoorPath
}

/**
 * Kiểm tra xem địa điểm có phải là điểm đến nội tuyến (Indoor) thuộc toà nhà Khoa CNTT&TT không
 */
export function isIndoorDestination(dest: DestinationItem): boolean {
  if (dest.category === 'room') return true
  if (dest.roomCode) return true
  if (dest.buildingName && dest.buildingName.includes('CNTT')) return true

  // Kiểm tra bounding box toạ độ toà nhà Khoa CNTT&TT
  const [lat, lng] = dest.coordinates
  return (
    lat >= 10.0305 &&
    lat <= 10.0317 &&
    lng >= 10.0306 &&
    lng <= 10.0316
  )
}

/**
 * Tìm đường đi kết hợp Ngoại tuyến (Outdoor) và Nội tuyến (Indoor):
 * LUÔN ƯU TIÊN ĐIỂM VÀO CỦA ĐƯỜNG NỘI TUYẾN BẮT ĐẦU TỪ CỔNG VÀO CHÍNH:
 * "0000000001405A71363E2F0AAE40240FC5A6800F3F" [10.030804827816267, 105.76893572420042]
 */
export async function calculateRoutePath(
  start: [number, number], // [lat, lng]
  end: [number, number], // [lat, lng]
  destination: DestinationItem
): Promise<RouteData> {
  const isIndoor = isIndoorDestination(destination)

  // Điểm kết thúc của đoạn đi bộ ngoài trời:
  // Nếu là điểm đến trong nhà -> đích của đoạn ngoài trời là CỔNG VÀO CHÍNH
  const outdoorTarget: [number, number] = isIndoor ? MAIN_ENTRANCE_POINT : end

  let outdoorCoords: [number, number][] = []
  let outdoorDistance = 0
  let outdoorDuration = 0

  // 1. TÍNH TOÁN ĐOẠN ĐƯỜNG NGOÀI TRỜI (OUTDOOR) ĐẾN CỔNG VÀO CHÍNH (HOẶC TOÀ NHÀ)
  try {
    const [startLat, startLng] = start
    const [tLat, tLng] = outdoorTarget

    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=true`
    const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(6000) })

    if (res.ok) {
      const data = await res.json()
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        outdoorCoords = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        )
        outdoorDistance = Math.round(route.distance)
        outdoorDuration = Math.round(route.duration)
      }
    }
  } catch (e) {
    console.warn('Lỗi gọi OSRM cho đoạn ngoài trời, sử dụng fallback:', e)
  }

  // Fallback nếu OSRM không trả về
  if (outdoorCoords.length < 2) {
    outdoorDistance = calculateDistanceMeters(start, outdoorTarget)
    outdoorDuration = Math.round(outdoorDistance / 1.2)
    const midLat = start[0] + (outdoorTarget[0] - start[0]) * 0.5
    const midLng = start[1] + (outdoorTarget[1] - start[1]) * 0.4
    outdoorCoords = [
      start,
      [midLat, start[1]],
      [midLat, midLng],
      [outdoorTarget[0], midLng],
      outdoorTarget,
    ]
  }

  // Đảm bảo điểm cuối đoạn ngoài trời khớp chính xác với cổng chính (hoặc đích ngoài trời)
  const lastOutdoor = outdoorCoords[outdoorCoords.length - 1]
  if (
    Math.abs(lastOutdoor[0] - outdoorTarget[0]) > 1e-6 ||
    Math.abs(lastOutdoor[1] - outdoorTarget[1]) > 1e-6
  ) {
    outdoorCoords.push(outdoorTarget)
  }

  // 2. NẾU LÀ ĐIỂM ĐẾN NỘI TUYẾN (INDOOR) -> NỐI TIẾP VỚI ĐƯỜNG NỘI TUYẾN BẮT ĐẦU TỪ CỔNG CHÍNH
  let fullCoordinates: [number, number][] = []
  let indoorCoords: [number, number][] = []
  let totalDistance = outdoorDistance
  let totalDuration = outdoorDuration
  const steps: RouteStep[] = []

  if (isIndoor) {
    indoorCoords = buildIndoorCorridorPath(destination)

    // Tính khoảng cách nội tuyến (indoor distance)
    let indoorDist = 0
    for (let i = 0; i < indoorCoords.length - 1; i++) {
      indoorDist += calculateDistanceMeters(indoorCoords[i], indoorCoords[i + 1])
    }
    const indoorDur = Math.round(indoorDist / 1.0) // Tốc độ đi bộ trong nhà ~1.0 m/s

    totalDistance += indoorDist
    totalDuration += indoorDur

    // Nối toạ độ: outdoorCoords (đã kết thúc tại MAIN_ENTRANCE_POINT) + indoorCoords (bắt đầu tại MAIN_ENTRANCE_POINT)
    fullCoordinates = [...outdoorCoords, ...indoorCoords.slice(1)]

    // BƯỚC CHỈ DẪN KẾT HỢP NGOẠI TUYẾN VÀ NỘI TUYẾN
    steps.push({
      instruction: 'Bắt đầu từ vị trí định vị cá nhân của bạn',
      distance: 0,
      duration: 0,
    })
    steps.push({
      instruction: `Đi bộ theo đường khuôn viên đến Cổng vào chính Khoa CNTT&TT`,
      distance: outdoorDistance,
      duration: outdoorDuration,
    })
    steps.push({
      instruction: `🚪 Đi vào toà nhà qua Cổng vào chính (Cổng chính ưu tiên)`,
      distance: Math.round(calculateDistanceMeters(MAIN_ENTRANCE_POINT, indoorCoords[1])),
      duration: 10,
      isIndoor: true,
    })
    steps.push({
      instruction: 'Đi qua Sảnh chính toà nhà, tiếp tục vào hành lang trung tâm',
      distance: 25,
      duration: 25,
      isIndoor: true,
    })
    if (destination.roomCode) {
      steps.push({
        instruction: `Đi theo hành lang nội tuyến đến Cửa phòng ${destination.roomCode}`,
        distance: Math.max(10, indoorDist - 30),
        duration: Math.max(10, indoorDur - 30),
        isIndoor: true,
      })
      steps.push({
        instruction: `Đến phòng học ${destination.title} - Tầng ${destination.level || '0'}`,
        distance: 5,
        duration: 5,
        isIndoor: true,
      })
    } else {
      steps.push({
        instruction: `Đi theo hành lang nội tuyến đến ${destination.title}`,
        distance: indoorDist - 15,
        duration: indoorDur - 15,
        isIndoor: true,
      })
    }
  } else {
    // Điểm đến ngoài trời
    fullCoordinates = outdoorCoords
    steps.push(
      { instruction: 'Bắt đầu từ vị trí của bạn', distance: 0, duration: 0 },
      {
        instruction: `Đi bộ đến ${destination.title}`,
        distance: outdoorDistance,
        duration: outdoorDuration,
      },
      { instruction: `Đến nơi: ${destination.title}`, distance: 0, duration: 0 }
    )
  }

  return {
    coordinates: fullCoordinates,
    distanceMeters: totalDistance,
    durationSeconds: totalDuration,
    distanceText: formatDistance(totalDistance),
    durationText: formatDuration(totalDuration),
    startPoint: start,
    endPoint: end,
    destination,
    steps,
    hasIndoorTransition: isIndoor,
    mainEntrancePoint: isIndoor ? MAIN_ENTRANCE_POINT : undefined,
    indoorCoordinates: isIndoor ? indoorCoords : undefined,
  }
}
