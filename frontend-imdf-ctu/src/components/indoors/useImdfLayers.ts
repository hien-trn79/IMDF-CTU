import { useCallback, useEffect, useRef, useState } from 'react'
import type { SysPublishedLayer } from '../../model/IMDF.model'
import { useUser } from '../../context/UserContext'

const BASE_URL = '/api'

const GEOMETRY_COLORS: Record<string, string> = {
  MultiPolygon: '#3b82f6',
  Polygon: '#3b82f6',
  MultiLineString: '#f59e0b',
  LineString: '#f59e0b',
  Point: '#ef4444',
  MultiPoint: '#ef4444',
}

export function getLayerColor(geometryType?: string): string {
  if (!geometryType) return '#6b7280'
  const normalized = Object.keys(GEOMETRY_COLORS).find((key) =>
    geometryType.toLowerCase().includes(key.toLowerCase())
  )
  return normalized ? GEOMETRY_COLORS[normalized] : '#6b7280'
}

export function useImdfLayers() {
  const [layers, setLayers] = useState<SysPublishedLayer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<number>>(new Set())
  const { authData } = useUser()
  const token = authData?.token || ''
  const abortRef = useRef<AbortController | null>(null)

  const loadLayers = useCallback(async () => {
    if (!token) {
      setLayers([])
      setVisibleLayerIds(new Set())
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/layers`, {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + token,
        },
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: SysPublishedLayer[] = await res.json()
      const published = data.filter((layer) => layer.isPublished !== false)
      setLayers(published)
      setVisibleLayerIds((current) => {
        const validIds = new Set(published.map((layer) => layer.layerId))
        return new Set([...current].filter((id) => validIds.has(id)))
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
      setError(`Không tải được danh sách layer: ${msg}`)
      setLayers([])
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadLayers()
    return () => abortRef.current?.abort()
  }, [loadLayers])

  const toggleLayer = useCallback((layerId: number) => {
    setVisibleLayerIds((prev) => {
      const next = new Set(prev)
      if (next.has(layerId)) next.delete(layerId)
      else next.add(layerId)
      return next
    })
  }, [])

  const setLayerVisible = useCallback((layerId: number, visible: boolean) => {
    setVisibleLayerIds((prev) => {
      const next = new Set(prev)
      if (visible) next.add(layerId)
      else next.delete(layerId)
      return next
    })
  }, [])

  return {
    layers,
    isLoading,
    error,
    visibleLayerIds,
    visibleLayers: layers.filter((layer) => visibleLayerIds.has(layer.layerId)),
    toggleLayer,
    setLayerVisible,
    reload: loadLayers,
  }
}
