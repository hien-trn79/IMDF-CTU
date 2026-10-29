import { MapContainer, TileLayer, WMSTileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { FeatureCollection } from 'geojson'
import { useCallback } from 'react'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import GridLineLayer from './GridLineLayers'
import type { IndoorFeatureItem } from './IndoorTable'
import DrawRouteLayer from './DrawRouteLayer'
import TopologyLayers from './TopologyLayers'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import type { SysPublishedLayer } from '../../model/IMDF.model'
import { wkbHexToPoint } from '../../utils/wkbParser'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface IndoorMapProps {
  showGridLines: boolean
  gridLineData: FeatureCollection
  features: IndoorFeatureItem[]
  selectedFeature: IndoorFeatureItem | null
  onSelectFeature: (item: IndoorFeatureItem) => void
  onOpenDetailModal: (item: IndoorFeatureItem) => void
  onClearSelection: () => void
  drawing: boolean
  snapEnabled: boolean
  drawCoordinates: [number, number][]
  onDrawCoordinatesChange: (coordinates: [number, number][]) => void
  networkNodes: NetworkNodeResponse[]
  networkEdges: NetworkEdgeResponse[]
  showNodes?: boolean
  showEdges?: boolean
  onSelectNode?: (node: NetworkNodeResponse) => void
  onSelectEdge?: (edge: NetworkEdgeResponse) => void
  // IMDF GeoServer layers
  visibleImdfLayers: SysPublishedLayer[]
}

function DrawingAndTopology({
  gridLineData,
  drawing,
  snapEnabled,
  drawCoordinates,
  onDrawCoordinatesChange,
  networkNodes,
  networkEdges,
  showNodes,
  showEdges,
  onSelectNode,
  onSelectEdge,
}: Pick<
  IndoorMapProps,
  | 'gridLineData'
  | 'drawing'
  | 'snapEnabled'
  | 'drawCoordinates'
  | 'onDrawCoordinatesChange'
  | 'networkNodes'
  | 'networkEdges'
  | 'showNodes'
  | 'showEdges'
  | 'onSelectNode'
  | 'onSelectEdge'
>) {
  const map = useMap()

  const snapCoordinates = useCallback(
    (point: L.LatLng): import('./DrawRouteLayer').SnapDetail => {
      if (!snapEnabled) return { latLng: point, snapType: 'none', label: '' }

      const sourcePx = map.latLngToLayerPoint(point)
      let nearestLatLng = point
      let minDistancePx = 18
      let snapType: 'node' | 'vertex' | 'edge' | 'none' = 'none'
      let label = ''

      networkNodes.forEach((node) => {
        const coord = wkbHexToPoint(node.geom)
        if (!coord) return
        const nodeLatLng = L.latLng(coord[1], coord[0])
        const distPx = sourcePx.distanceTo(map.latLngToLayerPoint(nodeLatLng))
        if (distPx < minDistancePx) {
          minDistancePx = distPx
          nearestLatLng = nodeLatLng
          snapType = 'node'
          label = `Node #${node.id}`
        }
      })

      gridLineData.features.forEach((feature) => {
        const checkVertex = (lng: number, lat: number) => {
          const vLatLng = L.latLng(lat, lng)
          const distPx = sourcePx.distanceTo(map.latLngToLayerPoint(vLatLng))
          if (distPx < minDistancePx) {
            minDistancePx = distPx
            nearestLatLng = vLatLng
            snapType = 'vertex'
            label = 'Dinh duong'
          }
        }
        if (feature.geometry.type === 'LineString') {
          feature.geometry.coordinates.forEach(([lng, lat]) => checkVertex(lng, lat))
        } else if (feature.geometry.type === 'MultiLineString') {
          feature.geometry.coordinates.forEach((line) => line.forEach(([lng, lat]) => checkVertex(lng, lat)))
        }
      })

      const snapToSegments = (line: number[][]) => {
        for (let index = 1; index < line.length; index++) {
          const startPx = map.latLngToLayerPoint([line[index - 1][1], line[index - 1][0]])
          const endPx = map.latLngToLayerPoint([line[index][1], line[index][0]])
          const deltaX = endPx.x - startPx.x
          const deltaY = endPx.y - startPx.y
          const lengthSquared = deltaX * deltaX + deltaY * deltaY
          if (lengthSquared === 0) continue

          const ratio = Math.max(
            0,
            Math.min(
              1,
              ((sourcePx.x - startPx.x) * deltaX + (sourcePx.y - startPx.y) * deltaY) / lengthSquared
            )
          )

          const projPx = L.point(startPx.x + ratio * deltaX, startPx.y + ratio * deltaY)
          const distPx = sourcePx.distanceTo(projPx)
          if (distPx < minDistancePx) {
            minDistancePx = distPx
            nearestLatLng = map.layerPointToLatLng(projPx)
            snapType = 'edge'
            label = 'Canh duong (Edge)'
          }
        }
      }

      gridLineData.features.forEach((feature) => {
        if (feature.geometry.type === 'LineString') snapToSegments(feature.geometry.coordinates)
        if (feature.geometry.type === 'MultiLineString') {
          feature.geometry.coordinates.forEach(snapToSegments)
        }
      })

      return { latLng: nearestLatLng, snapType, label }
    },
    [gridLineData, map, networkNodes, snapEnabled]
  )

  return (
    <>
      <DrawRouteLayer
        active={drawing}
        snapEnabled={snapEnabled}
        coordinates={drawCoordinates}
        snapCoordinates={snapCoordinates}
        onCoordinatesChange={onDrawCoordinatesChange}
      />
      <TopologyLayers
        edges={networkEdges}
        nodes={networkNodes}
        showNodes={showNodes}
        showEdges={showEdges}
        onSelectNode={onSelectNode}
        onSelectEdge={onSelectEdge}
      />
    </>
  )
}

export default function IndoorMap({
  showGridLines,
  gridLineData,
  features,
  selectedFeature,
  onSelectFeature,
  onOpenDetailModal,
  onClearSelection,
  drawing,
  snapEnabled,
  drawCoordinates,
  onDrawCoordinatesChange,
  networkNodes,
  networkEdges,
  showNodes,
  showEdges,
  onSelectNode,
  onSelectEdge,
  visibleImdfLayers,
}: IndoorMapProps) {
  const position: [number, number] = [10.03031, 105.76843]

  return (
    <div className="indoor_map relative h-full w-full rounded-2xl overflow-hidden">
      <MapContainer
        center={position}
        minZoom={1}
        zoom={17}
        maxZoom={22}
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
      >
        {/* Base map: OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={22}
        />

        {/* WMS layers tu GeoServer - chi hien thi layer duoc chon */}
        {visibleImdfLayers.map((layer) => {
          const workspace = layer.workspace || 'imdf_ctu'
          const wmsUrl = layer.wmsUrl || `/geoserver/${workspace}/wms`
          const layerParam = layer.layerName.includes(':')
            ? layer.layerName
            : `${workspace}:${layer.layerName}`
          return (
            <WMSTileLayer
              key={`wms-${layer.layerId}-${layer.layerName}`}
              url={wmsUrl}
              layers={layerParam}
              format="image/png"
              transparent={true}
              version="1.1.1"
              opacity={0.85}
              maxZoom={22}
            />
          )
        })}

        {showGridLines && (
          <GridLineLayer
            data={gridLineData}
            items={features}
            selectedFeature={selectedFeature}
            onSelectFeature={onSelectFeature}
            onOpenDetailModal={onOpenDetailModal}
            onClearSelection={onClearSelection}
          />
        )}
        <DrawingAndTopology
          gridLineData={gridLineData}
          drawing={drawing}
          snapEnabled={snapEnabled}
          drawCoordinates={drawCoordinates}
          onDrawCoordinatesChange={onDrawCoordinatesChange}
          networkNodes={networkNodes}
          networkEdges={networkEdges}
          showNodes={showNodes}
          showEdges={showEdges}
          onSelectNode={onSelectNode}
          onSelectEdge={onSelectEdge}
        />
      </MapContainer>
    </div>
  )
}
