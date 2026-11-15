// Tiện ích tìm kiếm địa điểm: chuẩn hoá chữ (bỏ dấu, bỏ ký tự phân cách), chấm điểm, xếp hạng.

export interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  // unit/anchor/amenity: dữ liệu trong nhà; place: địa điểm bên ngoài (Photon/OpenStreetMap)
  category: 'unit' | 'amenity' | 'anchor' | 'place'
  floorLabel?: string // VD: "Tầng trệt" (chỉ có với dữ liệu trong nhà)
  address?: string
  typeLabel?: string // VD: "Quán cà phê" (chỉ có với địa điểm bên ngoài)
  levelId?: number
  levelOrdinal?: number
  coordinates?: [number, number]
  geometry?: GeoJSON.Geometry
  rawProperties?: Record<string, any>
}

interface SearchKey {
  norm: string // chữ thường, không dấu: "di/101"
  compact: string // chỉ chữ + số: "di101"
  words: string[] // ["di", "101"]
  weight: number // trừ điểm cho khoá phụ
}

export interface SearchEntry {
  item: SearchResultItem
  keys: SearchKey[]
}

const stripChar = (c: string) =>
  c
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')

/** Bỏ dấu tiếng Việt + chữ thường. Xử lý từng ký tự nên độ dài chuỗi giữ nguyên (để highlight). */
export const normalizeText = (s: string): string =>
  Array.from(s)
    .map((c) => stripChar(c).toLowerCase())
    .join('')

const makeKey = (text: string, weight = 0): SearchKey => {
  const norm = normalizeText(text)
  return {
    norm,
    compact: norm.replace(/[^a-z0-9]/g, ''),
    words: norm.split(/[^a-z0-9]+/).filter(Boolean),
    weight,
  }
}

const pickString = (props: Record<string, any>, names: string[]): string => {
  for (const n of names) {
    const v = props?.[n]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

// Các thuộc tính phụ (nếu có) cũng được dùng để tìm kiếm, điểm thấp hơn tên chính
const UNIT_SECONDARY_KEYS = [
  'unit_code',
  'unitCode',
  'code',
  'ref',
  'short_name',
  'alt_name',
  'name_vi',
  'unit_category',
  'unitCategory',
  'category',
]

/** Tạo danh sách mục tìm kiếm (unit, anchor, amenity) của 1 tầng. */
export function buildFloorEntries(
  levelId: number,
  floorLabel: string,
  data: { unitData?: any; anchorData?: any; amenityData?: any }
): SearchEntry[] {
  const entries: SearchEntry[] = []

  data.unitData?.features?.forEach((f: any, i: number) => {
    const p = f?.properties ?? {}
    const name = pickString(p, ['unit_name', 'unitName', 'name:vi', 'name'])
    if (!name) return

    const secondary = UNIT_SECONDARY_KEYS.map((k) => pickString(p, [k])).filter(
      (s) => s && s !== name
    )

    entries.push({
      item: {
        id: `unit-${levelId}-${f.id ?? i}`,
        title: name,
        subtitle: floorLabel,
        category: 'unit',
        floorLabel,
        levelId,
        levelOrdinal: typeof p.ordinal === 'number' ? p.ordinal : undefined,
        geometry: f.geometry,
        rawProperties: p,
      },
      keys: [makeKey(name), ...secondary.map((s) => makeKey(s, 10))],
    })
  })

  data.anchorData?.features?.forEach((f: any, i: number) => {
    const p = f?.properties ?? {}
    const name = pickString(p, ['anchorName'])
    if (!name) return

    entries.push({
      item: {
        id: `anchor-${levelId}-${f.id ?? i}`,
        title: name,
        subtitle: [p.unitName, floorLabel].filter(Boolean).join(' · '),
        category: 'anchor',
        floorLabel,
        levelId,
        levelOrdinal: p.ordinal,
        geometry: f.geometry,
        rawProperties: p,
      },
      keys: [makeKey(name)],
    })
  })

  data.amenityData?.features?.forEach((f: any, i: number) => {
    const p = f?.properties ?? {}
    const name = pickString(p, ['amenityName'])
    if (!name) return

    const cate = pickString(p, ['amenityCateName'])
    entries.push({
      item: {
        id: `amenity-${levelId}-${f.id ?? i}`,
        title: name,
        subtitle: [p.unitName, cate, floorLabel].filter(Boolean).join(' · '),
        category: 'amenity',
        floorLabel,
        levelId,
        levelOrdinal: p.ordinal,
        geometry: f.geometry,
        rawProperties: p,
      },
      keys: [makeKey(name), ...(cate && cate !== name ? [makeKey(cate, 5)] : [])],
    })
  })

  return entries
}

function scoreKey(key: SearchKey, q: string, cq: string, tokens: string[]): number {
  if (key.norm === q || key.compact === cq) return 100
  if (key.norm.startsWith(q) || key.compact.startsWith(cq)) return 85
  if (tokens.length === 1 && key.words.some((w) => w.startsWith(tokens[0]))) return 70
  if (tokens.length > 1 && tokens.every((t) => key.norm.includes(t) || key.compact.includes(t))) {
    return 50
  }
  if (key.norm.includes(q)) return 45
  if (cq.length >= 2 && key.compact.includes(cq)) return 35
  return 0
}

/**
 * Tìm trong danh sách mục. Không phân biệt hoa thường, dấu và ký tự phân cách:
 * "di 101", "DI/101", "101/di", "phong may" đều khớp được "DI/101", "Phòng máy"...
 */
export function searchEntries(
  entries: SearchEntry[],
  query: string,
  options: { currentLevelId?: number; limit?: number } = {}
): SearchResultItem[] {
  const { currentLevelId, limit = 20 } = options
  const q = normalizeText(query.trim())
  const cq = q.replace(/[^a-z0-9]/g, '')
  if (!q || !cq) return []
  const tokens = q.split(/[^a-z0-9]+/).filter(Boolean)

  const scored: { item: SearchResultItem; score: number }[] = []
  for (const entry of entries) {
    let best = 0
    for (const key of entry.keys) {
      const s = scoreKey(key, q, cq, tokens) - key.weight
      if (s > best) best = s
    }
    if (best <= 0) continue

    // Ưu tiên phòng (unit) và kết quả ở tầng đang xem khi điểm bằng nhau
    if (entry.item.category === 'unit') best += 5
    if (currentLevelId !== undefined && entry.item.levelId === currentLevelId) best += 3
    scored.push({ item: entry.item, score: best })
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.item.title.length - b.item.title.length ||
      a.item.title.localeCompare(b.item.title, 'vi', { numeric: true })
  )
  return scored.slice(0, limit).map((s) => s.item)
}

/** Gợi ý khi chưa gõ gì: vài tiện ích khác loại + vài phòng của tầng đang xem. */
export function pickSuggestions(
  entries: SearchEntry[],
  currentLevelId: number | undefined,
  limit = 6
): SearchResultItem[] {
  const onFloor = entries.filter((e) => e.item.levelId === currentLevelId)
  const pool = onFloor.length > 0 ? onFloor : entries

  const result: SearchResultItem[] = []
  const seenTitles = new Set<string>()

  // Tiện ích: mỗi loại 1 mục (tối đa 3)
  for (const e of pool) {
    if (result.length >= 3) break
    if (e.item.category !== 'amenity') continue
    const cate = String(e.item.rawProperties?.amenityCateName ?? e.item.title)
    if (seenTitles.has(cate)) continue
    seenTitles.add(cate)
    result.push(e.item)
  }

  // Phòng: sắp xếp theo tên (có số thì sắp theo số)
  const units = pool
    .filter((e) => e.item.category === 'unit')
    .map((e) => e.item)
    .sort((a, b) => a.title.localeCompare(b.title, 'vi', { numeric: true }))
  for (const u of units) {
    if (result.length >= limit) break
    result.push(u)
  }

  return result.slice(0, limit)
}
