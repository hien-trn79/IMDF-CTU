import { useEffect, useMemo, useRef } from 'react'
import { Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { IndoorGeoJsonResponse } from '../../services/indoorRoutingService'
import type { IndoorRouteFeature } from '../../model/Navigation.model'
import { segmentCoordsToLatLng } from '../../services/indoorRoutingService'
import { FLOORS_LEVEL_ID } from '../../context/NavigateContext'

interface IndoorRouteLayerProps {
  route: IndoorGeoJsonResponse | null
  activeLevelId?: number
  onSwitchLevel?: (targetLevelId: number) => void
}

const STAIR_MARKER_CSS = `
  @keyframes indoor-stair-pulse {
    0% {
      transform: scale(0.85);
      opacity: 0.85;
    }
    70% {
      transform: scale(1.5);
      opacity: 0;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  .leaflet-marker-icon.indoor-stair-marker {
    background: transparent;
    border: 0;
  }
  .indoor-stair-pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9999px;
    background: #ea580c;
    color: #ffffff;
    border: 2px solid #ffffff;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 3px 10px rgba(234, 88, 12, 0.45);
    cursor: pointer;
    user-select: none;
  }
  .indoor-stair-pill::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 9999px;
    background: rgba(234, 88, 12, 0.45);
    animation: indoor-stair-pulse 1.5s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    z-index: -1;
    pointer-events: none;
  }
`

function IndoorRouteCameraFitter({
  routeKey,
  coordinates,
}: {
  routeKey: string
  coordinates: [number, number][]
}) {
  const map = useMap()
  const fittedKeyRef = useRef<string>('')

  useEffect(() => {
    if (!routeKey || coordinates.length < 2) return
    if (fittedKeyRef.current === routeKey) return

    fittedKeyRef.current = routeKey
    map.fitBounds(L.latLngBounds(coordinates), {
      padding: [60, 60],
      maxZoom: 20,
      animate: true,
      duration: 0.8,
    })
  }, [routeKey, coordinates, map])

  return null
}

const featureCoordinates = (feature: IndoorRouteFeature): [number, number][][] => {
  if (feature.geometry.type === 'MultiLineString') {
    const coordinates = feature.geometry.coordinates as [number, number][][]
    return coordinates.map((segment) => segmentCoordsToLatLng(segment))
  }
  const coordinates = feature.geometry.coordinates as [number, number][]
  return [segmentCoordsToLatLng(coordinates)]
}

const pointDistance = (a: [number, number], b: [number, number]) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

const stitchRoute = (features: IndoorRouteFeature[]): [number, number][] => {
  const segments = features
    .slice()
    .sort(
      (a, b) =>
        Number(a.properties?.seq ?? Number.MAX_SAFE_INTEGER) -
        Number(b.properties?.seq ?? Number.MAX_SAFE_INTEGER)
    )
    .flatMap(featureCoordinates)
    .filter((coordinates) => coordinates.length >= 2)

  return segments.reduce<[number, number][]>((route, segment) => {
    if (route.length === 0) return [...segment]

    const first = segment[0]
    const last = segment[segment.length - 1]
    const routeEnd = route[route.length - 1]
    const useReversed = pointDistance(routeEnd, last) < pointDistance(routeEnd, first)
    const orderedSegment = useReversed ? [...segment].reverse() : segment

    return [...route, ...orderedSegment]
  }, [])
}

const getFloorRank = (levelId: number): number => {
  const entries = Object.entries(FLOORS_LEVEL_ID)
  const index = entries.findIndex(([, id]) => id === levelId)
  if (index !== -1) {
    const [floorName] = entries[index]
    const matchedNum = floorName.match(/\d+/)
    if (matchedNum) return Number(matchedNum[0])
    return index
  }
  return levelId
}

const formatFloorLabel = (levelId: number): string => {
  const entry = Object.entries(FLOORS_LEVEL_ID).find(([, id]) => id === levelId)
  if (!entry) return `Tầng ${levelId}`
  const raw = entry[0].trim()
  return /^tầng/i.test(raw) ? raw : `Tầng ${raw}`
}

const createStairIcon = (label: string) =>
  L.divIcon({
    className: 'indoor-stair-marker',
    html: `<div class="indoor-stair-pill"><span>🪜</span><span>${label}</span></div>`,
    iconSize: undefined,
    iconAnchor: [14, 14],
  })

export default function IndoorRouteLayer({
  route,
  activeLevelId,
  onSwitchLevel,
}: IndoorRouteLayerProps) {
  const allFeatures = useMemo(() => {
    return (route?.features ?? [])
      .slice()
      .sort(
        (a, b) =>
          Number(a.properties?.seq ?? Number.MAX_SAFE_INTEGER) -
          Number(b.properties?.seq ?? Number.MAX_SAFE_INTEGER)
      )
  }, [route])

  const features = useMemo(() => {
    if (activeLevelId == null) return allFeatures
    const matched = allFeatures.filter((f) => f.properties?.levelId === activeLevelId)
    return matched.length > 0 ? matched : allFeatures
  }, [allFeatures, activeLevelId])

  const coordinates = useMemo(() => stitchRoute(features), [features])

  const routeKey = useMemo(() => {
    if (allFeatures.length === 0) return ''
    return allFeatures
      .map((f) => `${f.id ?? ''}:${f.properties?.seq ?? ''}:${f.properties?.levelId ?? ''}`)
      .join('|')
  }, [allFeatures])

  const stairTransition = useMemo(() => {
    if (allFeatures.length === 0 || activeLevelId == null) return null

    const levelsInOrder: number[] = []
    for (const f of allFeatures) {
      const lvl = f.properties?.levelId
      if (typeof lvl === 'number' && !levelsInOrder.includes(lvl)) {
        levelsInOrder.push(lvl)
      }
    }

    if (levelsInOrder.length < 2) return null

    const currentIdx = levelsInOrder.indexOf(activeLevelId)
    if (currentIdx === -1) return null

    const isForward = currentIdx < levelsInOrder.length - 1
    const nextLevelId = isForward ? levelsInOrder[currentIdx + 1] : levelsInOrder[currentIdx - 1]

    if (nextLevelId == null || nextLevelId === activeLevelId) return null

    const isNextFloorHigher = getFloorRank(nextLevelId) > getFloorRank(activeLevelId)
    const targetFloorText = formatFloorLabel(nextLevelId)
    const label = isNextFloorHigher
      ? `Di chuyển ${targetFloorText}`
      : `Di chuyển ${targetFloorText}`

    const currentFloorCoords = stitchRoute(
      allFeatures.filter((f) => f.properties?.levelId === activeLevelId)
    )
    if (currentFloorCoords.length === 0) return null

    const position = isForward
      ? currentFloorCoords[currentFloorCoords.length - 1]
      : currentFloorCoords[0]

    return { position, label, nextLevelId }
  }, [allFeatures, activeLevelId])

  const stairIcon = useMemo(() => {
    if (!stairTransition) return null
    return createStairIcon(stairTransition.label)
  }, [stairTransition])

  if (coordinates.length < 2) return null

  const line = { lineCap: 'round', lineJoin: 'round' } as const

  return (
    <>
      <style>{STAIR_MARKER_CSS}</style>
      <IndoorRouteCameraFitter routeKey={routeKey} coordinates={coordinates} />
      <Polyline
        positions={coordinates}
        pathOptions={{ ...line, color: '#ffffff', weight: 10, opacity: 0.98 }}
      />
      <Polyline positions={coordinates} pathOptions={{ ...line, color: '#2563eb', weight: 5 }} />

      {stairTransition && stairIcon && (
        <Marker
          position={stairTransition.position}
          icon={stairIcon}
          zIndexOffset={1000}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e)
              onSwitchLevel?.(stairTransition.nextLevelId)
            },
          }}
        />
      )}
    </>
  )
}
