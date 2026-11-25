import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import GridLineLayer from './GridLineLayers'
import TopologyLayers from './TopologyLayers'
import IndoorDrawingLayer from './IndoorDrawingLayer'
import type { Feature, Geometry } from 'geojson'
import type { NetworkNodeItem } from '../../model/route models/NetworkNode.model'
import type { NetworkEdgeItem } from '../../model/route models/NetworkEdge.model'
import type {
  PreTopologyItem,
  PreTopologyResponse,
} from '../../model/route models/preTopology.model'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface IndoorMapProps {
  showGridLines: boolean
  gridLineData: PreTopologyResponse
  features: PreTopologyItem[]
  selectedFeature: PreTopologyItem | null
  onSelectFeature: (item: PreTopologyItem) => void
  onOpenDetailModal: (item: PreTopologyItem) => void
  onClearSelection: () => void
  drawing: boolean
  snapEnabled: boolean
  drawCoordinates: [number, number][]
  onDrawCoordinatesChange: (coordinates: [number, number][]) => void
  networkNodes: NetworkNodeItem[]
  networkEdges: NetworkEdgeItem[]
  showNodes?: boolean
  showEdges?: boolean
  onSelectNode?: (node: NetworkNodeItem) => void
  onSelectEdge?: (edge: NetworkEdgeItem) => void
  buildingCoordinates?: [number, number] | null
}

// Cập nhật vị trí trung tâm của bản đồ khi buildingCoordinates thay đổi
function MapCenterUpdater({ center }: { center?: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 18, { duration: 1 })
    }
  }, [center, map])
  return null
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
  return (
    <>
      <IndoorDrawingLayer
        drawing={drawing}
        snapEnabled={snapEnabled}
        coordinates={drawCoordinates}
        onCoordinatesChange={onDrawCoordinatesChange}
        // Kết hợp các feature từ gridLineData, networkNodes và networkEdges để hiển thị trên bản đồ
        features={
          [...gridLineData.features, ...networkNodes, ...networkEdges] as Feature<
            Geometry,
            Record<string, unknown>
          >[]
        }
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
  buildingCoordinates,
}: IndoorMapProps) {
  const position: [number, number] = buildingCoordinates || [10.03031, 105.76843]

  return (
    <div className="indoor_map relative h-full w-full rounded-2xl overflow-hidden">
      <MapContainer
        center={position}
        minZoom={1}
        zoom={17}
        maxZoom={22}
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
      >
        <MapCenterUpdater center={buildingCoordinates} />
        {/* Base map: OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={22}
        />

        {showGridLines && (
          <GridLineLayer
            data={gridLineData}
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
