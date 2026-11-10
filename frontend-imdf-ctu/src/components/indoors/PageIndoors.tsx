import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import IndoorMap from './IndoorMap'

import FeatureDetailModal from '../outdoors/FeatureDetailModal'
import ModalAddIndoor from './ModalAddIndoor'
import ModalEditGridLine from './ModalEditGridLine'
import ModalEditNode from './ModalEditNode'
import ModalEditEdge from './ModalEditEdge'
import ImportTopologyModal from './ImportTopologyModal'
import { networkNodeService } from '../../services/networkNodeService'
import { networkEdgeService } from '../../services/networkEdgeService'
import { normalizeNode } from '../../services/networkNodeService'
import { normalizeEdge } from '../../services/networkEdgeService'
import { gridLineService } from '../../services/gridLineService'
import type {
  NetworkNodeFeature,
  NetworkNodeItem,
} from '../../model/route models/NetworkNode.model'
import type {
  NetworkEdgeFeature,
  NetworkEdgeItem,
} from '../../model/route models/NetworkEdge.model'
import { useUser } from '../../context/UserContext'
import { authHeaders } from '../../services/authHeaders'
import type {
  PreTopologyItem,
  PreTopologyResponse,
} from '../../model/route models/preTopology.model'
import IndoorSideBar from './IndoorSideBar'
import IndoorTable, { type IndoorFeatureItem } from './IndoorTable'
import { useLayerContext } from '../../context/LayerContext'

export default function PageIndoors() {
  const [selectedFeature, setSelectedFeature] = useState<PreTopologyItem | null>(null)
  const [selectedDetailFeature, setSelectedDetailFeature] = useState<IndoorFeatureItem | null>(null)
  const [isOpenSelectedFeatureModal, setIsOpenSelectedFeatureModal] = useState(false)

  const mapCardRef = useRef<HTMLDivElement>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)

  const [networkNodes, setNetworkNodes] = useState<NetworkNodeItem[]>([])
  const [networkEdges, setNetworkEdges] = useState<NetworkEdgeItem[]>([])
  const [topologyReloadKey, setTopologyReloadKey] = useState(0)
  const [drawing, setDrawing] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [drawCoordinates, setDrawCoordinates] = useState<[number, number][]>([])

  // Topology layer visibility
  const [showGridLines, setShowGridLines] = useState(false)
  const [showNodes, setShowNodes] = useState(false)
  const [showEdges, setShowEdges] = useState(false)

  // Edit modals
  const [editGridLineItem, setEditGridLineItem] = useState<PreTopologyItem | null>(null)
  const [editNodeItem, setEditNodeItem] = useState<NetworkNodeItem | null>(null)
  const [editEdgeItem, setEditEdgeItem] = useState<NetworkEdgeItem | null>(null)
  const [isOpenImportTopology, setIsOpenImportTopology] = useState(false)
  const [importTopologyFile, setImportTopologyFile] = useState<File | null>(null)
  const [selectedIndoorFeature, setSelectedIndoorFeature] = useState<IndoorFeatureItem | null>(
    null
  )

  const { authData } = useUser()
  const token = authData?.token || ''

  const isLoading = false

  const reloadTopology = () => setTopologyReloadKey((key) => key + 1)

  const inset = isMapFullscreen ? 0 : 8
  const [preTopologyData, setPreTopologyData] = useState<PreTopologyResponse | null>(null)
  const [nodesData, setNodesData] = useState<NetworkNodeFeature | null>(null)
  const [edgesData, setEdgesData] = useState<NetworkEdgeFeature | null>(null)

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
      console.error('Không thể thực hiện bật/tắt toàn màn hình:', error)
    }
  }

  const handleSelectFeature = (item: PreTopologyItem) => {
    setSelectedFeature(item)
    const index = preTopologyData?.features.indexOf(item) ?? -1
    setSelectedIndoorFeature({
      feature: item,
      layer: { id: 'grid-lines', layerName: 'Grid line' },
      index: index < 0 ? 0 : index,
    })
  }
  const handleClearSelection = () => setSelectedFeature(null)

  // MỞ MODAL CHI TIẾT KHI CLICK VÀO ĐỐI TƯỢNG TRÊN BẢN ĐỒ
  const handleOpenDetailModal = async (item: PreTopologyItem | null) => {
    if (item) {
      setSelectedFeature(item)
      const index = preTopologyData?.features.indexOf(item) ?? -1
      setSelectedDetailFeature({
        feature: item,
        layer: { id: 'grid-lines', layerName: 'Grid line' },
        index: index < 0 ? 0 : index,
      })
    }
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.error('Không thể thực hiện thoát toàn màn hình:', error)
      }
    }
    setIsOpenSelectedFeatureModal(true)
  }
  // FETCH TOAN BO DATA DU LIEU TU PHIA BACKEND
  const { selectedLevelIndoorId, selectedTableIndoor } = useLayerContext()

  useEffect(() => {
    if (!selectedLevelIndoorId) return

    const fetchPretopologyData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/grid-lines?levelId=${selectedLevelIndoorId}`,
          {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(token),
          },
          }
        )
        if (response.ok) {
          const data: PreTopologyResponse = await response.json()
          setPreTopologyData(data)
        }
      } catch (error) {
        console.error('Lỗi khi fetch dữ liệu pre-topology:', error)
      }
    }

    const fetchTopology = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/indoor-routes?levelId=${selectedLevelIndoorId}`,
          { headers: authHeaders(token) }
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const routes = (await response.json()) as Array<{ id: number }>
        await fetchPretopologyData()
        if (routes.length > 0) {
          const nodeFetches = routes.map((r) =>
            fetch(`http://localhost:8081/api/network-nodes?routeId=${r.id}`, {
              headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            }).then((res) => (res.ok ? res.json() : { features: [] }))
          )
          const edgeFetches = routes.map((r) =>
            fetch(`http://localhost:8081/api/network-edges?routeId=${r.id}`, {
              headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            }).then((res) => (res.ok ? res.json() : { features: [] }))
          )

          const [allNodesRes, allEdgesRes] = await Promise.all([
            Promise.all(nodeFetches),
            Promise.all(edgeFetches),
          ])

          const rawNodes = allNodesRes.flatMap((d) => d.features || []).map(normalizeNode)
          const rawEdges = allEdgesRes.flatMap((d) => d.features || []).map(normalizeEdge)

          const uniqueNodes = Array.from(new Map(rawNodes.map((n) => [n.id, n])).values())
          const uniqueEdges = Array.from(new Map(rawEdges.map((e) => [e.id, e])).values())

          setNodesData({ type: 'FeatureCollection', features: uniqueNodes })
          setNetworkNodes(uniqueNodes)
          setEdgesData({ type: 'FeatureCollection', features: uniqueEdges })
          setNetworkEdges(uniqueEdges)
        } else {
          setNodesData({ type: 'FeatureCollection', features: [] })
          setEdgesData({ type: 'FeatureCollection', features: [] })
          setNetworkNodes([])
          setNetworkEdges([])
        }
      } catch (error) {
        console.error('Lỗi khi fetch route/topology theo tầng:', error)
      }
    }

    fetchTopology()

    return () => {
      setPreTopologyData(null)
      setNodesData(null)
      setEdgesData(null)
    }
  }, [selectedLevelIndoorId, token, topologyReloadKey])

  // Quan sát sự thay đổi của selectedTableIndoor để cập nhật trạng thái hiển thị các lớp trên bản đồ
  useEffect(() => {
    setShowGridLines(selectedTableIndoor === 'grid-lines')
    setShowNodes(selectedTableIndoor === 'nodes')
    setShowEdges(selectedTableIndoor === 'edges')
    setSelectedIndoorFeature(null)
  }, [selectedTableIndoor])

  const indoorTableFeatures = useMemo<IndoorFeatureItem[]>(() => {
    if (selectedTableIndoor === 'grid-lines') {
      return (preTopologyData?.features ?? []).map((feature, index) => ({
        feature,
        layer: { id: 'grid-lines', layerName: 'Grid line' },
        index,
      }))
    }
    if (selectedTableIndoor === 'nodes') {
      return (nodesData?.features ?? []).map((feature, index) => ({
        feature,
        layer: { id: 'nodes', layerName: 'Node' },
        index,
      }))
    }
    return (edgesData?.features ?? []).map((feature, index) => ({
      feature,
      layer: { id: 'edges', layerName: 'Edge' },
      index,
    }))
  }, [edgesData, nodesData, preTopologyData, selectedTableIndoor])

  const handleSelectIndoorFeature = useCallback((item: IndoorFeatureItem) => {
    setSelectedIndoorFeature(item)
    if (item.layer.id === 'grid-lines') {
      setSelectedFeature(item.feature as PreTopologyItem)
    }
  }, [])

  const handleEditIndoorFeature = useCallback((item: IndoorFeatureItem) => {
    setSelectedIndoorFeature(item)
    if (item.layer.id === 'grid-lines') setEditGridLineItem(item.feature as PreTopologyItem)
    if (item.layer.id === 'nodes') setEditNodeItem(item.feature as NetworkNodeItem)
    if (item.layer.id === 'edges') setEditEdgeItem(item.feature as NetworkEdgeItem)
  }, [])

  const handleSelectNodeFromMap = useCallback(
    (node: NetworkNodeItem) => {
      const index = networkNodes.indexOf(node)
      setSelectedIndoorFeature({
        feature: node,
        layer: { id: 'nodes', layerName: 'Node' },
        index: index < 0 ? 0 : index,
      })
    },
    [networkNodes]
  )
  const handleSelectEdgeFromMap = useCallback(
    (edge: NetworkEdgeItem) => {
      const index = networkEdges.indexOf(edge)
      setSelectedIndoorFeature({
        feature: edge,
        layer: { id: 'edges', layerName: 'Edge' },
        index: index < 0 ? 0 : index,
      })
    },
    [networkEdges]
  )

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
            gridLineData={
              preTopologyData ? preTopologyData : { type: 'FeatureCollection', features: [] }
            }
            features={preTopologyData?.features ?? []}
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
              features={indoorTableFeatures}
              loading={isLoading}
              selectedFeature={selectedIndoorFeature}
              onSelectFeature={handleSelectIndoorFeature}
              onOpenDetailModal={(item) => {
                if (!item) return
                setSelectedIndoorFeature(item)
                setSelectedDetailFeature(item)
                if (item.layer.id === 'grid-lines') {
                  setSelectedFeature(item.feature as PreTopologyItem)
                }
                setIsOpenSelectedFeatureModal(true)
              }}
              onEditFeature={handleEditIndoorFeature}
              onDeleteFeature={async (item) => {
                if (item.layer.id === 'grid-lines') {
                  await gridLineService.delete(Number(item.feature.id), token)
                  reloadTopology()
                }
                if (item.layer.id === 'nodes') {
                  await networkNodeService.delete(Number(item.feature.id), token)
                  reloadTopology()
                }
                if (item.layer.id === 'edges') {
                  await networkEdgeService.delete(Number(item.feature.id), token)
                  reloadTopology()
                }
              }}
            />
          </div>
        </div>
      </main>

      {/* INDOOR ASIDE */}
      <aside className="outdoor_aside_map min-w-0 overflow-y-auto lg:col-span-1 lg:max-h-[min(85vh,720px)] justify-items-center">
        <IndoorSideBar
          isLoading={isLoading}
          setIsOpenAddIndoor={setIsOpenAddIndoor}
          isNodeVisible={showNodes}
          edgeCount={networkEdges.length}
          isEdgeVisible={showEdges}
          onToggleNode={setShowNodes}
          onToggleEdge={setShowEdges}
          onOpenImportModal={() => {
            setImportTopologyFile(null)
            setIsOpenImportTopology(true)
          }}
          onReload={reloadTopology}
        />
      </aside>

      {/* MODAL CHI TIET */}
      <FeatureDetailModal
        isOpenSelectedFeatureModal={isOpenSelectedFeatureModal}
        onClose={() => {
          setIsOpenSelectedFeatureModal(false)
          setSelectedDetailFeature(null)
        }}
        data={selectedDetailFeature}
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
            reloadTopology()
            setIsOpenAddIndoor(false)
            setDrawing(false)
            setDrawCoordinates([])
          }}
          onOpenImportTopology={() => {
            setIsOpenAddIndoor(false)
            setDrawing(false)
            setDrawCoordinates([])
            setIsOpenImportTopology(true)
          }}
          nodes={networkNodes}
          edges={networkEdges}
          token={token}
        />
      )}

      {/* MODAL THEM TAP TIN TOPOLOGY */}
      {isOpenImportTopology && (
        <ImportTopologyModal
          open={isOpenImportTopology}
          setOpen={setIsOpenImportTopology}
          onSuccess={() => {
            reloadTopology()
            setIsOpenImportTopology(false)
            setImportTopologyFile(null)
          }}
          token={token}
          initialFile={importTopologyFile}
          currentLevelId={selectedLevelIndoorId}
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
            setEditGridLineItem(null)
            reloadTopology()
          }}
          onDelete={async (id) => {
            await gridLineService.delete(id, token)
            reloadTopology()
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
