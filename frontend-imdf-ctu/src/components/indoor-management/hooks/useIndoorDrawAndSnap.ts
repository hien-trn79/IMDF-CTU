import { useState, useCallback, useMemo } from 'react'
import type { DrawingGeometryMode, IMDFFeatureType } from '../../../model/IMDF.model'
import {
  calculatePolygonAreaSqm,
  calculatePolylineLengthMeters,
  type SnapResult,
} from '../../../utils/imdfSnapUtils'

interface UseIndoorDrawAndSnapProps {
  onGeometryComplete?: (geometry: {
    type: string
    coordinates: any
  }, featureType: IMDFFeatureType) => void
}

export function useIndoorDrawAndSnap({ onGeometryComplete }: UseIndoorDrawAndSnapProps = {}) {
  const [drawingMode, setDrawingMode] = useState<DrawingGeometryMode>('none')
  const [targetFeatureType, setTargetFeatureType] = useState<IMDFFeatureType>('unit')
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [snapTolerancePx] = useState(18)
  const [coordinates, setCoordinates] = useState<[number, number][]>([])
  const [currentSnap, setCurrentSnap] = useState<SnapResult | null>(null)
  const [mousePosition, setMousePosition] = useState<[number, number] | null>(null)

  const isDrawing = drawingMode !== 'none'

  const startDrawing = useCallback(
    (mode: DrawingGeometryMode, featureType: IMDFFeatureType = 'unit') => {
      setDrawingMode(mode)
      setTargetFeatureType(featureType)
      setCoordinates([])
      setCurrentSnap(null)
      setMousePosition(null)
    },
    []
  )

  const cancelDrawing = useCallback(() => {
    setDrawingMode('none')
    setCoordinates([])
    setCurrentSnap(null)
    setMousePosition(null)
  }, [])

  const undoCoordinate = useCallback(() => {
    setCoordinates((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))
  }, [])

  const addCoordinate = useCallback((coord: [number, number]) => {
    setCoordinates((prev) => {
      // Tránh duplicate liên tiếp
      if (prev.length > 0) {
        const last = prev[prev.length - 1]
        if (Math.abs(last[0] - coord[0]) < 1e-7 && Math.abs(last[1] - coord[1]) < 1e-7) {
          return prev
        }
      }
      return [...prev, coord]
    })
  }, [])

  const finishDrawing = useCallback(() => {
    if (coordinates.length === 0) {
      cancelDrawing()
      return
    }

    let geometry: { type: string; coordinates: any } | null = null

    if (drawingMode === 'point') {
      geometry = {
        type: 'Point',
        coordinates: coordinates[0],
      }
    } else if (drawingMode === 'linestring') {
      if (coordinates.length < 2) return
      geometry = {
        type: 'LineString',
        coordinates: coordinates,
      }
    } else if (drawingMode === 'polygon' || drawingMode === 'multipolygon') {
      if (coordinates.length < 3) return
      // Đóng vòng polygon (first == last)
      const ring = [...coordinates]
      const first = ring[0]
      const last = ring[ring.length - 1]
      if (Math.abs(first[0] - last[0]) > 1e-7 || Math.abs(first[1] - last[1]) > 1e-7) {
        ring.push([first[0], first[1]])
      }

      if (drawingMode === 'multipolygon') {
        geometry = {
          type: 'MultiPolygon',
          coordinates: [[ring]],
        }
      } else {
        geometry = {
          type: 'Polygon',
          coordinates: [ring],
        }
      }
    }

    if (geometry && onGeometryComplete) {
      onGeometryComplete(geometry, targetFeatureType)
    }

    setDrawingMode('none')
    setCoordinates([])
    setCurrentSnap(null)
    setMousePosition(null)
  }, [coordinates, drawingMode, targetFeatureType, onGeometryComplete, cancelDrawing])

  // Tính toán diện tích theo thời gian thực (gồm cả tọa độ chuột đang rê)
  const currentAreaSqm = useMemo(() => {
    if (drawingMode !== 'polygon' && drawingMode !== 'multipolygon') return 0
    const pointsToMeasure = mousePosition ? [...coordinates, mousePosition] : coordinates
    return calculatePolygonAreaSqm(pointsToMeasure)
  }, [coordinates, mousePosition, drawingMode])

  // Tính toán độ dài theo thời gian thực
  const currentLengthMeters = useMemo(() => {
    const pointsToMeasure = mousePosition ? [...coordinates, mousePosition] : coordinates
    return calculatePolylineLengthMeters(pointsToMeasure)
  }, [coordinates, mousePosition])

  return {
    drawingMode,
    targetFeatureType,
    snapEnabled,
    snapTolerancePx,
    coordinates,
    mousePosition,
    currentSnap,
    isDrawing,
    currentAreaSqm,
    currentLengthMeters,
    startDrawing,
    cancelDrawing,
    undoCoordinate,
    addCoordinate,
    finishDrawing,
    setSnapEnabled,
    setCurrentSnap,
    setMousePosition,
    setCoordinates,
  }
}
