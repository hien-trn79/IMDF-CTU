// Cổng vào chính toà nhà Khoa CNTT&TT theo mã hex WKB Point được chỉ định:
// "0000000001405A71363E2F0AAE40240FC5A6800F3F"
export const MAIN_ENTRANCE_HEX = '0000000001405A71363E2F0AAE40240FC5A6800F3F'
export const MAIN_ENTRANCE_POINT: [number, number] = [10.030804827816267, 105.76893572420042] // [lat, lng]

// Tọa độ mặc định tại khuôn viên ĐH Cần Thơ Khu II (Cổng A Đường 3 Tháng 2)
export const CTU_DEFAULT_USER_LOCATION: [number, number] = [10.02985, 105.77052]

/**
 TÌm vị trí trung tâm của 1 Geometry 
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
 * Kiểm tra xem địa điểm có phải là điểm đến nội tuyến (Indoor) thuộc toà nhà Khoa CNTT&TT không
 */
// export function isIndoorDestination(destination: DestinationItem): boolean {
//   if (destination.category === 'room') return true
//   if (destination.roomCode) return true
//   if (destination.buildingName && destination.buildingName.includes('CNTT')) return true

//   // Kiểm tra bounding box toạ độ toà nhà Khoa CNTT&TT
//   const [lat, lng] = destination.coordinates
//   return lat >= 10.0305 && lat <= 10.0317 && lng >= 10.0306 && lng <= 10.0316
// }

/**
 * Tìm đường đi kết hợp Ngoại tuyến (Outdoor) và Nội tuyến (Indoor):
 * LUÔN ƯU TIÊN ĐIỂM VÀO CỦA ĐƯỜNG NỘI TUYẾN BẮT ĐẦU TỪ CỔNG VÀO CHÍNH:
 * "0000000001405A71363E2F0AAE40240FC5A6800F3F" [10.030804827816267, 105.76893572420042]
 */
