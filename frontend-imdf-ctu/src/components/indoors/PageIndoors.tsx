import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import IndoorMap from './IndoorMap'
import IndoorSideBar from './IndoorSideBar'
import { useGridLines } from './useGridLines'
import { useImdfLayers } from './useImdfLayers'
import type { IndoorFeatureItem } from './IndoorTable'
import IndoorTable from '../indoors/IndoorTable'
import FeatureDetailModal from '../outdoors/FeatureDetailModal'
import ModalAddIndoor from './ModalAddIndoor'
import ModalEditGridLine from './ModalEditGridLine'
import ModalEditNode from './ModalEditNode'
import ModalEditEdge from './ModalEditEdge'
import { networkNodeService } from '../../services/networkNodeService'
import { networkEdgeService } from '../../services/networkEdgeService'
import { gridLineService } from '../../services/gridLineService'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import { useUser } from '../../context/UserContext'
import { wkbHexToPoint } from '../../utils/wkbParser'
import { parseWKBHexToCoords } from '../../utils/wkbUtils'

const GRID_LINE_LAYER = { id: 'grid_line', layerName: 'Duong luoi (Grid lines)' }
const NODE_LAYER = { id: 'network_node', layerName: 'Network Node' }
const EDGE_LAYER = { id: 'network_edge', layerName: 'Network Edge' }

export default function PageIndoors() {
  const [selectedFeature, setSelectedFeature] = useState<IndoorFeatureItem | null>(null)
  const [isOpenSelectedFeatureModal, setIsOpenSelectedFeatureModal] = useState(false)

  const mapCardRef = useRef<HTMLDivElement>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)

  const { geoJson, gridLines, isLoading, error, reload } = useGridLines()
  const [networkNodes, setNetworkNodes] = useState<NetworkNodeResponse[]>([])
  const [networkEdges, setNetworkEdges] = useState<NetworkEdgeResponse[]>([])
  const [topologyReloadKey, setTopologyReloadKey] = useState(0)
  const [drawing, setDrawing] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [drawCoordinates, setDrawCoordinates] = useState<[number, number][]>([])

  // Topology layer visibility
  const [showGridLines, setShowGridLines] = useState(false)
  const [showNodes, setShowNodes] = useState(false)
  const [showEdges, setShowEdges] = useState(false)

  // Edit modals
  const [editGridLineItem, setEditGridLineItem] = useState<IndoorFeatureItem | null>(null)
  const [editNodeItem, setEditNodeItem] = useState<NetworkNodeResponse | null>(null)
  const [editEdgeItem, setEditEdgeItem] = useState<NetworkEdgeResponse | null>(null)

  const { authData } = useUser()
  const token = authData?.token || ''

  // IMDF layers tu GeoServer /api/layers
  const {
    layers: imdfLayers,
    isLoading: imdfLayersLoading,
    error: imdfLayersError,
    visibleLayerIds,
    visibleLayers: visibleImdfLayers,
    toggleLayer: toggleImdfLayer,
    reload: reloadImdfLayers,
  } = useImdfLayers()

  const reloadTopology = () => setTopologyReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setNetworkNodes([])
      setNetworkEdges([])
      return
    }

    Promise.all([networkNodeService.getAll(token), networkEdgeService.getAll(token)])
      .then(([nodes, edges]) => {
        if (!cancelled) {
          setNetworkNodes(nodes)
          setNetworkEdges(edges)
        }
      })
      .catch((topologyError: unknown) => {
        console.error('Loi tai topology:', topologyError)
      })
    return () => {
      cancelled = true
    }
  }, [token, topologyReloadKey])

  const gridLineFeatures = useMemo<IndoorFeatureItem[]>(
    () =>
      showGridLines
        ? geoJson.features.map((f, index) => ({
            feature: {
              ...f,
              id: String(f.id ?? index),
              properties: (f.properties ?? {}) as Record<string, any>,
            },
            layer: GRID_LINE_LAYER,
            index,
          }))
        : [],
    [geoJson, showGridLines]
  )

  const nodeFeatures = useMemo<IndoorFeatureItem[]>(
    () =>
      showNodes
        ? networkNodes.map((node, index) => {
            const pt = wkbHexToPoint(node.geom)
            return {
              feature: {
                id: String(node.id),
                type: 'Feature',
                geometry: pt ? { type: 'Point', coordinates: pt } : null,
                geometry_wkb: node.geom,
                properties: {
                  id: node.id,
                  isConnector: node.isConnector,
                  indoorRouteId: node.indoorRouteId,
                  indoorRouteName: node.indoorRouteName,
                },
              },
              layer: NODE_LAYER,
              index,
            }
          })
        : [],
    [networkNodes, showNodes]
  )

  const edgeFeatures = useMemo<IndoorFeatureItem[]>(
    () =>
      showEdges
        ? networkEdges.map((edge, index) => {
            const coords = parseWKBHexToCoords(edge.geometry)
            return {
              feature: {
                id: String(edge.id),
                type: 'Feature',
                geometry: coords.length >= 2 ? { type: 'LineString', coordinates: coords } : null,
                geometry_wkb: edge.geometry,
                properties: {
                  id: edge.id,
                  source: edge.source,
                  target: edge.target,
                  cost: edge.cost,
                  reverseCost: edge.reverseCost,
                  indoorRouteId: edge.indoorRouteId,
                  indoorRouteName: edge.indoorRouteName,
                },
              },
              layer: EDGE_LAYER,
              index,
            }
          })
        : [],
    [networkEdges, showEdges]
  )

  const allFeatures = useMemo<IndoorFeatureItem[]>(
    () => [...gridLineFeatures, ...nodeFeatures, ...edgeFeatures],
    [gridLineFeatures, nodeFeatures, edgeFeatures]
  )

  const inset = isMapFullscreen ? 0 : 8

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(document.fullscreenElement === mapCardRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setPanelHeight(Math.round(entry.contentRect.height))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const toggleMapFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await mapCardRef.current?.requestFullscreen()
      }
    } catch (error) {
      console.error('Khong the bat/tat toan man hinh:', error)
    }
  }

  const handleToggleGridLine = (visible: boolean) => {
    setShowGridLines(visible)
    if (!visible) {
      setSelectedFeature(null)
      setIsOpenSelectedFeatureModal(false)
    }
  }
  const handleToggleNode = (visible: boolean) => {
    setShowNodes(visible)
    if (!visible && selectedFeature?.layer.id === NODE_LAYER.id) {
      setSelectedFeature(null)
    }
  }
  const handleToggleEdge = (visible: boolean) => {
    setShowEdges(visible)
    if (!visible && selectedFeature?.layer.id === EDGE_LAYER.id) {
      setSelectedFeature(null)
    }
  }

  const handleSelectFeature = (item: IndoorFeatureItem) => {
    setSelectedFeature(item)
  }
  const handleClearSelection = () => setSelectedFeature(null)

  const handleOpenDetailModal = async (item: IndoorFeatureItem | null) => {
    if (item) setSelectedFeature(item)
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.error('Khong the thoat toan man hinh:', error)
      }
    }
    setIsOpenSelectedFeatureModal(true)
  }

  const handleEditFeature = (item: IndoorFeatureItem) => {
    if (item.layer.id === GRID_LINE_LAYER.id) {
      setEditGridLineItem(item)
    } else if (item.layer.id === NODE_LAYER.id) {
      const nodeId = Number(item.feature.id)
      const node = networkNodes.find((n) => n.id === nodeId) ?? null
      setEditNodeItem(node)
    } else if (item.layer.id === EDGE_LAYER.id) {
      const edgeId = Number(item.feature.id)
      const edge = networkEdges.find((e) => e.id === edgeId) ?? null
      setEditEdgeItem(edge)
    }
  }

  const handleDeleteFeature = useCallback(
    async (item: IndoorFeatureItem) => {
      const id = Number(item.feature.id)
      try {
        if (item.layer.id === GRID_LINE_LAYER.id) {
          await gridLineService.delete(id, token)
          reload()
        } else if (item.layer.id === NODE_LAYER.id) {
          await networkNodeService.delete(id, token)
          reloadTopology()
        } else if (item.layer.id === EDGE_LAYER.id) {
          await networkEdgeService.delete(id, token)
          reloadTopology()
        }
      } catch (err) {
        console.error('Loi xoa doi tuong:', err)
      }
    },
    [token, reload]
  )

  const handleSelectNodeFromMap = useCallback((node: NetworkNodeResponse) => {
    setEditNodeItem(node)
  }, [])
  const handleSelectEdgeFromMap = useCallback((edge: NetworkEdgeResponse) => {
    setEditEdgeItem(edge)
  }, [])

  const [isOpenAddIndoor, setIsOpenAddIndoor] = useState(false)

  return (
    <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-5 px-2">
      {/* INDOOR MAIN MAP + BANG NOI */}
      <main className="page-outdoor-main min-w-0 lg:col-span-4">
        <div
          ref={mapCardRef}
          style={
            {
              '--map-bottom-offset': `${panelHeight + 20 - inset}px`,
            } as CSSProperties
          }
          className={`outdoor_map relative isolate overflow-hidden bg-white [&_.leaflet-bottom]:mb-(--map-bottom-offset) ${
            isMapFullscreen
              ? 'h-screen w-screen rounded-none border-0 p-0'
              : 'h-[min(89vh,720px)] min-h-82.5 rounded-2xl border border-sky-100 p-2 shadow-sm'
          }`}
        >
          <IndoorMap
            showGridLines={showGridLines}
            gridLineData={geoJson}
            features={gridLineFeatures}
            selectedFeature={selectedFeature}
            onSelectFeature={handleSelectFeature}
            onOpenDetailModal={handleOpenDetailModal}
            onClearSelection={handleClearSelection}
            drawing={drawing}
            snapEnabled={snapEnabled}
            drawCoordinates={drawCoordinates}
            onDrawCoordinatesChange={setDrawCoordinates}
            networkNodes={networkNodes}
            networkEdges={networkEdges}
            showNodes={showNodes}
            showEdges={showEdges}
            onSelectNode={handleSelectNodeFromMap}
            onSelectEdge={handleSelectEdgeFromMap}
            visibleImdfLayers={visibleImdfLayers}
          />

          {/* Nut mo rong ban do */}
          <button
            type="button"
            onClick={toggleMapFullscreen}
            title={isMapFullscreen ? 'Thu nho ban do' : 'Mo rong toan bo ban do'}
            aria-label={isMapFullscreen ? 'Thu nho ban do' : 'Mo rong toan bo ban do'}
            style={{ left: 10 + inset, top: 84 + inset }}
            className="absolute z-1000 flex h-8.5 w-8.5 items-center justify-center rounded border-2 border-black/20 bg-white bg-clip-padding text-slate-700 hover:bg-slate-100"
          >
            {isMapFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* BANG NOI */}
          <div ref={panelRef} className="absolute right-1 bottom-1 left-1 z-1000">
            <IndoorTable
              features={allFeatures}
              loading={isLoading}
              selectedFeature={selectedFeature}
              onSelectFeature={handleSelectFeature}
              onOpenDetailModal={handleOpenDetailModal}
              onEditFeature={handleEditFeature}
              onDeleteFeature={handleDeleteFeature}
            />
          </div>
        </div>
      </main>

      {/* INDOOR ASIDE */}
      <aside className="outdoor_aside_map min-w-0 overflow-y-auto lg:col-span-1 lg:max-h-[min(85vh,720px)] justify-items-center">
        <IndoorSideBar
          isLoading={isLoading}
          error={error}
          gridLineCount={gridLines.length}
          isGridLineVisible={showGridLines}
          onToggleGridLine={handleToggleGridLine}
          onRefresh={() => {
            reload()
            reloadTopology()
          }}
          setIsOpenAddIndoor={setIsOpenAddIndoor}
          nodeCount={networkNodes.length}
          isNodeVisible={showNodes}
          onToggleNode={handleToggleNode}
          edgeCount={networkEdges.length}
          isEdgeVisible={showEdges}
          onToggleEdge={handleToggleEdge}
          imdfLayers={imdfLayers}
          imdfLayersLoading={imdfLayersLoading}
          imdfLayersError={imdfLayersError}
          visibleLayerIds={visibleLayerIds}
          onToggleImdfLayer={toggleImdfLayer}
          onRefreshImdfLayers={reloadImdfLayers}
        />
      </aside>

      {/* MODAL CHI TIET */}
      <FeatureDetailModal
        isOpenSelectedFeatureModal={isOpenSelectedFeatureModal}
        onClose={() => setIsOpenSelectedFeatureModal(false)}
        data={selectedFeature}
      />

      {/* MODAL THEM INDOOR */}
      {isOpenAddIndoor && (
        <ModalAddIndoor
          isOpen={isOpenAddIndoor}
          onClose={() => {
            setIsOpenAddIndoor(false)
            setDrawing(false)
            setDrawCoordinates([])
          }}
          coordinates={drawCoordinates}
          drawing={drawing}
          snapEnabled={snapEnabled}
          onDrawingChange={setDrawing}
          onClearCoordinates={() => setDrawCoordinates([])}
          onSnapChange={setSnapEnabled}
          onCreated={() => {
            reload()
            reloadTopology()
            setIsOpenAddIndoor(false)
            setDrawing(false)
            setDrawCoordinates([])
          }}
          nodes={networkNodes}
          edges={networkEdges}
          token={token}
        />
      )}

      {/* MODAL CHINH SUA GRIDLINE */}
      {editGridLineItem && (
        <ModalEditGridLine
          isOpen={!!editGridLineItem}
          onClose={() => setEditGridLineItem(null)}
          gridLineItem={editGridLineItem}
          token={token}
          nodes={networkNodes}
          edges={networkEdges}
          onUpdated={() => {
            reload()
            setEditGridLineItem(null)
          }}
          onDelete={async (id) => {
            await gridLineService.delete(id, token)
            reload()
            setEditGridLineItem(null)
          }}
        />
      )}

      {/* MODAL CHINH SUA NODE */}
      <ModalEditNode
        isOpen={!!editNodeItem}
        onClose={() => setEditNodeItem(null)}
        node={editNodeItem}
        token={token}
        onUpdated={() => {
          reloadTopology()
          setEditNodeItem(null)
        }}
        onDeleted={async (id) => {
          await networkNodeService.delete(id, token)
          reloadTopology()
          setEditNodeItem(null)
        }}
      />

      {/* MODAL CHINH SUA EDGE */}
      <ModalEditEdge
        isOpen={!!editEdgeItem}
        onClose={() => setEditEdgeItem(null)}
        edge={editEdgeItem}
        token={token}
        onUpdated={() => {
          reloadTopology()
          setEditEdgeItem(null)
        }}
        onDeleted={async (id) => {
          await networkEdgeService.delete(id, token)
          reloadTopology()
          setEditEdgeItem(null)
        }}
      />
    </div>
  )
}
