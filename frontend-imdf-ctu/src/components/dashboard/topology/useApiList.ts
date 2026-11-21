import { useCallback, useEffect, useState } from 'react'
import { useUser } from '../../../context/UserContext'

export const API_URL = 'http://localhost:8081/api'

/**
 * Bộ nhớ đệm theo đường dẫn API (ví dụ "/levels?buildingId=3").
 * Chọn lại một mục đã từng tải thì dữ liệu hiện ngay lập tức, đồng thời tải lại ngầm để cập nhật.
 */
const cache = new Map<string, unknown[]>()

interface Store<T> {
  key: string | null
  items: T[] | null
}

export function useApiList<T>(path: string | null, normalize: (raw: unknown) => T[]) {
  const { token } = useUser()
  const [store, setStore] = useState<Store<T>>({ key: null, items: null })
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Đăng xuất thì xóa bộ nhớ đệm để không lộ dữ liệu sang phiên khác
  useEffect(() => {
    if (!token) cache.clear()
  }, [token])

  // Đổi path thì dùng ngay dữ liệu đệm của path mới (nếu có), không hiện nhầm dữ liệu của path cũ
  const cached = path ? (cache.get(path) as T[] | undefined) : undefined
  const items: T[] | null = store.key === path ? store.items : (cached ?? null)

  useEffect(() => {
    if (!path || !token) {
      setIsValidating(false)
      setError('')
      return
    }

    const controller = new AbortController()
    setIsValidating(true)
    setError('')

    fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi ${res.status}`)
        return res.json() as Promise<unknown>
      })
      .then((raw) => {
        if (controller.signal.aborted) return
        const list = normalize(raw)
        cache.set(path, list)
        setStore({ key: path, items: list })
        setIsValidating(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        console.error(`Lỗi tải ${path}:`, err)
        setError(err instanceof Error ? err.message : 'Không tải được dữ liệu')
        setIsValidating(false)
      })

    // Đổi lựa chọn giữa chừng: hủy request cũ để kết quả cũ không ghi đè kết quả mới
    return () => controller.abort()
  }, [path, token, reloadKey, normalize])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  /** Sửa trực tiếp danh sách đang hiển thị (cập nhật lạc quan), ví dụ bỏ ngay dòng vừa xóa */
  const mutate = useCallback(
    (updater: (current: T[]) => T[]) => {
      if (!path) return
      const next = updater((cache.get(path) as T[] | undefined) ?? [])
      cache.set(path, next)
      setStore({ key: path, items: next })
    },
    [path]
  )

  return {
    items,
    /** Chưa có dữ liệu nào để hiển thị và đang tải */
    isLoading: items === null && isValidating && !error,
    /** Đang tải (kể cả tải ngầm khi đã có dữ liệu đệm) */
    isValidating,
    error,
    refetch,
    mutate,
  }
}

/* ------------------------------ Chuẩn hóa dữ liệu ------------------------------ */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Nhận mảng thuần hoặc FeatureCollection, trả về mảng phần tử */
export const asArray = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw
  if (isRecord(raw) && Array.isArray(raw.features)) return raw.features
  return []
}

export interface LevelItem {
  id: number
  ordinal?: number
  [key: string]: unknown
}

/** Level có thể trả về dạng mảng thuần hoặc GeoJSON Feature; gộp properties lên cùng cấp với id */
export const normalizeLevels = (raw: unknown): LevelItem[] =>
  asArray(raw)
    .map((item): LevelItem | null => {
      if (!isRecord(item)) return null
      const props = isRecord(item.properties) ? item.properties : {}
      const flat = item.type === 'Feature' ? { ...props, id: item.id ?? props.id } : item
      return typeof flat.id === 'number' ? (flat as LevelItem) : null
    })
    .filter((l): l is LevelItem => l !== null)
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0) || a.id - b.id)

const pickString = (obj: Record<string, unknown>, keys: string[]) => {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/** Nhãn hiển thị của một tầng, ví dụ "Tầng trệt (tầng 0)" hoặc "Tầng #12" nếu thiếu tên */
export const levelLabel = (l: LevelItem): string => {
  const name = pickString(l, ['levelName', 'name', 'shortName', 'levelVietnameseName'])
  const ordinal = typeof l.ordinal === 'number' ? `tầng ${l.ordinal}` : ''
  if (name && ordinal) return `${name} (${ordinal})`
  return name || (ordinal ? ordinal.charAt(0).toUpperCase() + ordinal.slice(1) : `Tầng #${l.id}`)
}
