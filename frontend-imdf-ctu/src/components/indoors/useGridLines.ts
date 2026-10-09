import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GridLineResponse } from '../../model/GridLine.model'
import { useUser } from '../../context/UserContext'
import { gridLineService } from '../../services/gridLineService'
import { gridLinesToFeatureCollection } from './gridLineGeoJson'

export function useGridLines() {
  const { authData } = useUser()
  const token = authData?.token || ''

  const [gridLines, setGridLines] = useState<GridLineResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    gridLineService
      .getAll(token)
      .then((data) => {
        if (!cancelled) setGridLines(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('Lỗi tải grid lines:', err)
        setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    // Bỏ qua kết quả của request cũ khi token đổi hoặc component unmount
    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  // Chỉ parse WKB lại khi dữ liệu thay đổi
  const geoJson = useMemo(() => gridLinesToFeatureCollection(gridLines), [gridLines])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { gridLines, geoJson, isLoading, error, reload }
}
