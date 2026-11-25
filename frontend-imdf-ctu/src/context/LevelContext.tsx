import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authHeaders } from '../services/authHeaders'
import type { UnitGeoJson } from '../model/geoJsonEntity.model'
import { useUser } from './UserContext'

interface LevelContextValue {
  selectedLevelId: string | null
  setSelectedLevelId: (levelId: string | null) => void
  unitGeoJson: UnitGeoJson | null
  isLoadingUnits: boolean
  unitsError: string | null
  reloadUnits: () => void
  reloadData: () => void
  dataVersion: number
  selectedTable: string
  setSelectedTable: (table: string) => void
  selectedTables: string[]
  toggleTable: (table: string) => void
}

const LevelContext = createContext<LevelContextValue | undefined>(undefined)

export function LevelProvider({ children }: { children: ReactNode }) {
  const { token } = useUser()
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null)
  const [unitGeoJson, setUnitGeoJson] = useState<UnitGeoJson | null>(null)
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [unitsError, setUnitsError] = useState<string | null>(null)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [selectedTable, setSelectedTable] = useState('unit')
  const [selectedTables, setSelectedTables] = useState<string[]>(['unit'])
  const reloadUnits = useCallback(() => setReloadVersion((version) => version + 1), [])
  const reloadData = useCallback(() => setReloadVersion((version) => version + 1), [])
  const toggleTable = useCallback((table: string) => {
    setSelectedTables((tables) =>
      tables.includes(table) ? tables.filter((value) => value !== table) : [...tables, table]
    )
    setSelectedTable(table)
  }, [])

  useEffect(() => {
    if (!selectedLevelId) {
      setUnitGeoJson(null)
      setUnitsError(null)
      return
    }

    const levelId = selectedLevelId
    const controller = new AbortController()
    const fetchUnits = async () => {
      setIsLoadingUnits(true)
      setUnitsError(null)
      try {
        const params = new URLSearchParams({
          page: '0',
          size: '100',
          sort: 'id,ASC',
          levelId,
        })
        const response = await fetch(`http://localhost:8081/api/units?${params}`, {
          headers: authHeaders(token ?? ''),
          signal: controller.signal,
        })
        if (!response.ok) {
          setUnitGeoJson({ type: 'FeatureCollection', features: [] } as any)
          return
        }
        const data = (await response.json()) as UnitGeoJson
        setUnitGeoJson(data)
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('Lỗi khi tải UnitGeojson theo level:', error)
        setUnitGeoJson({ type: 'FeatureCollection', features: [] } as any)
        setUnitsError('Không tải được dữ liệu unit của tầng.')
      } finally {
        if (!controller.signal.aborted) setIsLoadingUnits(false)
      }
    }

    fetchUnits()
    return () => controller.abort()
  }, [selectedLevelId, token, reloadVersion])

  return (
    <LevelContext.Provider
      value={{
        selectedLevelId,
        setSelectedLevelId,
        unitGeoJson,
        isLoadingUnits,
        unitsError,
        reloadUnits,
        reloadData,
        dataVersion: reloadVersion,
        selectedTable,
        setSelectedTable,
        selectedTables,
        toggleTable,
      }}
    >
      {children}
    </LevelContext.Provider>
  )
}

export function useLevel() {
  const context = useContext(LevelContext)
  if (!context) throw new Error('useLevel phải được sử dụng trong LevelProvider')
  return context
}
