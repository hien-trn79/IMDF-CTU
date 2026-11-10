import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { PreTopologyResponse } from '../model/route models/preTopology.model'
import { authHeaders } from '../services/authHeaders'
import { useUser } from './UserContext'

interface LayerContextValue {
  selectedLevelIndoorId: string | null
  setSelectedLevelIndoorId: (levelIndoorId: string | null) => void
  PreTopologyGeojson: PreTopologyResponse | null
  reloadData: () => void
  dataVersion: number
  selectedTableIndoor: string
  setSelectedTableIndoor: (table: string) => void
  selectedTablesIndoor: string[]
  toggleTableIndoor: (table: string) => void
}

const LayerContext = createContext<LayerContextValue | undefined>(undefined)

const tableDefaultValue = 'grid-lines'

export function LayerProvider({ children }: { children: React.ReactNode }) {
  const { token } = useUser()
  const [selectedLevelIndoorId, setSelectedLevelIndoorId] = useState<string | null>('3')
  const [PreTopologyGeojson, setPreTopologyGeojson] = useState<PreTopologyResponse | null>(null)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [selectedTableIndoor, setSelectedTableIndoor] = useState<string>(tableDefaultValue)
  const [selectedTablesIndoor, setSelectedTablesIndoor] = useState<string[]>([tableDefaultValue])

  const reloadData = useCallback(() => {
    if (token) setReloadVersion((version) => version + 1)
  }, [token])

  const toggleTableIndoor = (table: string) => {
    setSelectedTablesIndoor((tables) =>
      tables.includes(table) ? tables.filter((value) => value !== table) : [...tables, table]
    )
    setSelectedTableIndoor(table)
  }

  const selectTableIndoor = (table: string) => {
    setSelectedTableIndoor(table)
    setSelectedTablesIndoor([table])
  }

  useEffect(() => {
    if (!token || !selectedLevelIndoorId) {
      setPreTopologyGeojson(null)
      return
    }

    const levelId = selectedLevelIndoorId
    const controller = new AbortController()

    const fetchPretopologyData = async () => {
      try {
        const response = await fetch(`http://localhost:8081/api/grid-lines?levelId=${levelId}`, {
          method: 'GET',
          headers: authHeaders(token),
          signal: controller.signal,
        })
        if (response.ok) {
          const data: PreTopologyResponse = await response.json()
          setPreTopologyGeojson(data)
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('Error fetching pretopology data:', error)
      }
    }

    fetchPretopologyData()

    return () => {
      controller.abort()
    }
  }, [selectedLevelIndoorId, reloadVersion, token])

  return (
    <LayerContext.Provider
      value={{
        selectedLevelIndoorId,
        setSelectedLevelIndoorId,
        PreTopologyGeojson,
        reloadData,
        dataVersion: reloadVersion,
        selectedTableIndoor,
        setSelectedTableIndoor: selectTableIndoor,
        selectedTablesIndoor,
        toggleTableIndoor,
      }}
    >
      {children}
    </LayerContext.Provider>
  )
}

export function useLayerContext() {
  const context = useContext(LayerContext)
  if (!context) {
    throw new Error('useLayerContext must be used within a LayerProvider')
  }

  return context
}
