import { useEffect, useState, useMemo } from 'react'
import { ConfigProvider, message, Alert, Button, Input, Space, Tabs, Badge, Spin } from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  AimOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons'
import viVN from 'antd/locale/vi_VN'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import { networkNodeService } from '../../services/networkNodeService'
import { networkEdgeService } from '../../services/networkEdgeService'
import { indoorRouteService } from '../../services/indoorRouteService'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'

import NetworkNodeTable from './NetworkNodeTable'
import NetworkNodeDetailDrawer from './NetworkNodeDetailDrawer'
import NetworkNodeFormModal from './NetworkNodeFormModal'
import NetworkOverlay from './NetworkOverlay'
import NetworkEdgeDetailDrawer from '../network-edge/NetworkEdgeDetailDrawer'
import NetworkEdgeFormModal from '../network-edge/NetworkEdgeFormModal'
import NetworkEdgeTable from '../network-edge/NetworkEdgeTable'

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const MAP_CENTER: [number, number] = [10.03031, 105.76843]

export default function NetworkNodeManagement() {
  // Data states
  const [nodes, setNodes] = useState<NetworkNodeResponse[]>([])
  const [edges, setEdges] = useState<NetworkEdgeResponse[]>([])
  const [indoorRoutes, setIndoorRoutes] = useState<IndoorRouteResponse[]>([])

  // Loading / error
  const [loadingNodes, setLoadingNodes] = useState(true)
  const [loadingEdges, setLoadingEdges] = useState(true)
  const [errorNodes, setErrorNodes] = useState<string | null>(null)
  const [errorEdges, setErrorEdges] = useState<string | null>(null)

  // Search
  const [nodeSearch, setNodeSearch] = useState('')
  const [edgeSearch, setEdgeSearch] = useState('')

  // Selected / editing Node
  const [selectedNode, setSelectedNode] = useState<NetworkNodeResponse | null>(null)
  const [editingNode, setEditingNode] = useState<NetworkNodeResponse | null>(null)
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false)
  const [submittingNode, setSubmittingNode] = useState(false)
  const [submitNodeError, setSubmitNodeError] = useState<string | null>(null)
  const [deletingNodeId, setDeletingNodeId] = useState<number | null>(null)

  // Selected / editing Edge
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdgeResponse | null>(null)
  const [editingEdge, setEditingEdge] = useState<NetworkEdgeResponse | null>(null)
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false)
  const [submittingEdge, setSubmittingEdge] = useState(false)
  const [submitEdgeError, setSubmitEdgeError] = useState<string | null>(null)
  const [deletingEdgeId, setDeletingEdgeId] = useState<number | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState<'nodes' | 'edges'>('nodes')

  // ── Fetch ──────────────────────────────────────────
  const fetchNodes = async () => {
    setLoadingNodes(true)
    setErrorNodes(null)
    try {
      const data = await networkNodeService.getAll()
      setNodes(data)
    } catch (err: any) {
      setErrorNodes(err?.message || 'Không thể tải Network Node từ Backend.')
    } finally {
      setLoadingNodes(false)
    }
  }

  const fetchEdges = async () => {
    setLoadingEdges(true)
    setErrorEdges(null)
    try {
      const data = await networkEdgeService.getAll()
      setEdges(data)
    } catch (err: any) {
      setErrorEdges(err?.message || 'Không thể tải Network Edge từ Backend.')
    } finally {
      setLoadingEdges(false)
    }
  }

  const fetchRoutes = async () => {
    try {
      const data = await indoorRouteService.getAll()
      setIndoorRoutes(data)
    } catch {
      // non-critical
    }
  }

  useEffect(() => {
    fetchNodes()
    fetchEdges()
    fetchRoutes()
  }, [])

  // ── Filtered ──────────────────────────────────────
  const filteredNodes = useMemo(() => {
    if (!nodeSearch) return nodes
    const q = nodeSearch.toLowerCase()
    return nodes.filter(
      (n) =>
        n.id.toString().includes(q) ||
        n.indoorRouteName.toLowerCase().includes(q) ||
        (n.isConnector ? 'connector' : 'thường').includes(q)
    )
  }, [nodes, nodeSearch])

  const filteredEdges = useMemo(() => {
    if (!edgeSearch) return edges
    const q = edgeSearch.toLowerCase()
    return edges.filter(
      (e) =>
        e.id.toString().includes(q) ||
        e.source.toString().includes(q) ||
        e.target.toString().includes(q) ||
        e.indoorRouteName.toLowerCase().includes(q)
    )
  }, [edges, edgeSearch])

  // ── Node handlers ─────────────────────────────────
  const handleNodeView = (node: NetworkNodeResponse) => {
    setSelectedNode(node)
    setSelectedEdge(null)
  }

  const handleNodeEdit = (node: NetworkNodeResponse) => {
    setEditingNode(node)
    setSubmitNodeError(null)
    setIsNodeModalOpen(true)
  }

  const handleNodeSubmit = async (data: any) => {
    setSubmittingNode(true)
    setSubmitNodeError(null)
    try {
      if (editingNode) {
        const updated = await networkNodeService.update(editingNode.id, data)
        setNodes((prev) => prev.map((n) => (n.id === editingNode.id ? updated : n)))
        if (selectedNode?.id === editingNode.id) setSelectedNode(updated)
        message.success('Cập nhật Node thành công!')
      } else {
        const created = await networkNodeService.create(data)
        setNodes((prev) => [created, ...prev])
        message.success('Tạo Node mới thành công!')
      }
      setIsNodeModalOpen(false)
      setEditingNode(null)
    } catch (err: any) {
      setSubmitNodeError(err?.message || 'Có lỗi khi lưu Node.')
    } finally {
      setSubmittingNode(false)
    }
  }

  const handleNodeDelete = async (id: number) => {
    setDeletingNodeId(id)
    try {
      await networkNodeService.delete(id)
      setNodes((prev) => prev.filter((n) => n.id !== id))
      if (selectedNode?.id === id) setSelectedNode(null)
      message.success('Đã xóa Node thành công!')
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi xóa Node.')
    } finally {
      setDeletingNodeId(null)
    }
  }

  // ── Edge handlers ─────────────────────────────────
  const handleEdgeView = (edge: NetworkEdgeResponse) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
  }

  const handleEdgeEdit = (edge: NetworkEdgeResponse) => {
    setEditingEdge(edge)
    setSubmitEdgeError(null)
    setIsEdgeModalOpen(true)
  }

  const handleEdgeSubmit = async (data: any) => {
    setSubmittingEdge(true)
    setSubmitEdgeError(null)
    try {
      if (editingEdge) {
        const updated = await networkEdgeService.update(editingEdge.id, data)
        setEdges((prev) => prev.map((e) => (e.id === editingEdge.id ? updated : e)))
        if (selectedEdge?.id === editingEdge.id) setSelectedEdge(updated)
        message.success('Cập nhật Edge thành công!')
      } else {
        const created = await networkEdgeService.create(data)
        setEdges((prev) => [created, ...prev])
        message.success('Tạo Edge mới thành công!')
      }
      setIsEdgeModalOpen(false)
      setEditingEdge(null)
    } catch (err: any) {
      setSubmitEdgeError(err?.message || 'Có lỗi khi lưu Edge.')
    } finally {
      setSubmittingEdge(false)
    }
  }

  const handleEdgeDelete = async (id: number) => {
    setDeletingEdgeId(id)
    try {
      await networkEdgeService.delete(id)
      setEdges((prev) => prev.filter((e) => e.id !== id))
      if (selectedEdge?.id === id) setSelectedEdge(null)
      message.success('Đã xóa Edge thành công!')
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi xóa Edge.')
    } finally {
      setDeletingEdgeId(null)
    }
  }

  const isMapReady = !loadingNodes && !loadingEdges

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#10b981', // emerald-500
          borderRadius: 8,
          fontFamily: 'inherit',
        },
      }}
    >
      <div className="h-full min-h-0 overflow-y-auto bg-slate-50/50">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <NodeIndexOutlined className="text-emerald-600" />
              Network Node &amp; Edge
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Quản lý Node và Edge mạng lưới đường đi nội khu — hiển thị trực tiếp trên Map
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined spin={loadingNodes || loadingEdges} />}
              onClick={() => {
                fetchNodes()
                fetchEdges()
              }}
              disabled={loadingNodes || loadingEdges}
              className="text-gray-600 border-gray-300 hover:text-emerald-600 hover:border-emerald-300"
            >
              Làm mới
            </Button>
            {activeTab === 'nodes' ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingNode(null)
                  setSubmitNodeError(null)
                  setIsNodeModalOpen(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-sm font-medium"
              >
                Thêm Node
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingEdge(null)
                  setSubmitEdgeError(null)
                  setIsEdgeModalOpen(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-500 shadow-sm font-medium"
              >
                Thêm Edge
              </Button>
            )}
          </Space>
        </div>

        {/* Error alerts */}
        {(errorNodes || errorEdges) && (
          <div className="px-4 pb-2 space-y-2">
            {errorNodes && (
              <Alert
                type="error"
                showIcon
                message="Lỗi tải Node"
                description={errorNodes}
                action={
                  <Button size="small" danger onClick={fetchNodes} icon={<ReloadOutlined />}>
                    Thử lại
                  </Button>
                }
              />
            )}
            {errorEdges && (
              <Alert
                type="error"
                showIcon
                message="Lỗi tải Edge"
                description={errorEdges}
                action={
                  <Button size="small" danger onClick={fetchEdges} icon={<ReloadOutlined />}>
                    Thử lại
                  </Button>
                }
              />
            )}
          </div>
        )}

        {/* Main: Map (top) + Table (bottom) */}
        <div className="flex flex-col px-4 pb-4 gap-4">
          {/* Map Panel */}
          <div className="relative h-[clamp(440px,52vh,640px)] flex-none rounded-xl overflow-hidden border border-emerald-200 shadow-sm">
            {!isMapReady && (
              <div className="absolute inset-0 z-[1000] bg-white/80 flex items-center justify-center">
                <Spin size="large" tip="Đang tải dữ liệu bản đồ..." />
              </div>
            )}
            <MapContainer
              center={MAP_CENTER}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              maxZoom={22}
              minZoom={1}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxNativeZoom={19}
                maxZoom={22}
              />
              {isMapReady && (
                <NetworkOverlay
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNode?.id ?? null}
                  selectedEdgeId={selectedEdge?.id ?? null}
                  onNodeClick={(node) => {
                    handleNodeView(node)
                    setActiveTab('nodes')
                  }}
                  onEdgeClick={(edge) => {
                    handleEdgeView(edge)
                    setActiveTab('edges')
                  }}
                  visible={true}
                />
              )}
            </MapContainer>

            {/* Map legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 rounded-lg shadow p-2 text-xs space-y-1 border border-gray-200">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-emerald-700" />
                Node thường
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border border-blue-700" />
                Connector
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-indigo-500 inline-block" />
                Edge
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-orange-500 inline-block" />
                Đang chọn
              </div>
            </div>

            {/* Node/Edge count badge */}
            <div className="absolute top-3 left-3 z-[1000] flex gap-2">
              <span className="bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                <AimOutlined className="mr-1" />
                {nodes.length} Nodes
              </span>
              <span className="bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                {edges.length} Edges
              </span>
            </div>
          </div>

          {/* Table Panel */}
          <div className="min-h-[460px] flex flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Tabs
              activeKey={activeTab}
              onChange={(k) => setActiveTab(k as 'nodes' | 'edges')}
              className="flex min-h-[420px] flex-col [&_.ant-tabs-content-holder]:min-h-[360px] [&_.ant-tabs-content]:min-h-[360px]"
              items={[
                {
                  key: 'nodes',
                  label: (
                    <span className="flex items-center gap-1.5">
                      <AimOutlined className="text-emerald-600" />
                      Network Nodes
                      <Badge
                        count={filteredNodes.length}
                        showZero
                        color="#10b981"
                        className="ml-1"
                      />
                    </span>
                  ),
                  children: (
                    <div className="flex flex-col gap-2 h-full">
                      <div className="flex items-center gap-3">
                        <Input
                          placeholder="Tìm theo ID, tên tuyến, loại node..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          allowClear
                          value={nodeSearch}
                          onChange={(e) => setNodeSearch(e.target.value)}
                          className="max-w-sm"
                        />
                        <span className="text-sm text-gray-500">
                          Hiển thị:{' '}
                          <strong className="text-emerald-700">{filteredNodes.length}</strong> /{' '}
                          {nodes.length}
                        </span>
                      </div>
                      <NetworkNodeTable
                        nodes={filteredNodes}
                        loading={loadingNodes}
                        selectedId={selectedNode?.id ?? null}
                        onView={handleNodeView}
                        onEdit={handleNodeEdit}
                        onDelete={handleNodeDelete}
                        deletingId={deletingNodeId}
                        onOpenCreate={() => {
                          setEditingNode(null)
                          setSubmitNodeError(null)
                          setIsNodeModalOpen(true)
                        }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'edges',
                  label: (
                    <span className="flex items-center gap-1.5">
                      <NodeIndexOutlined className="text-indigo-600" />
                      Network Edges
                      <Badge
                        count={filteredEdges.length}
                        showZero
                        color="#6366f1"
                        className="ml-1"
                      />
                    </span>
                  ),
                  children: (
                    <div className="flex flex-col gap-2 h-full">
                      <div className="flex items-center gap-3">
                        <Input
                          placeholder="Tìm theo ID, source, target, tên tuyến..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          allowClear
                          value={edgeSearch}
                          onChange={(e) => setEdgeSearch(e.target.value)}
                          className="max-w-sm"
                        />
                        <span className="text-sm text-gray-500">
                          Hiển thị:{' '}
                          <strong className="text-indigo-700">{filteredEdges.length}</strong> /{' '}
                          {edges.length}
                        </span>
                      </div>
                      <NetworkEdgeTable
                        edges={filteredEdges}
                        loading={loadingEdges}
                        selectedId={selectedEdge?.id ?? null}
                        onView={handleEdgeView}
                        onEdit={handleEdgeEdit}
                        onDelete={handleEdgeDelete}
                        deletingId={deletingEdgeId}
                        onOpenCreate={() => {
                          setEditingEdge(null)
                          setSubmitEdgeError(null)
                          setIsEdgeModalOpen(true)
                        }}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* Drawers */}
        <NetworkNodeDetailDrawer
          open={!!selectedNode}
          onClose={() => setSelectedNode(null)}
          node={selectedNode}
          onEdit={handleNodeEdit}
          onDelete={handleNodeDelete}
          deleting={deletingNodeId === selectedNode?.id}
        />

        <NetworkEdgeDetailDrawer
          open={!!selectedEdge}
          onClose={() => setSelectedEdge(null)}
          edge={selectedEdge}
          nodes={nodes}
          onEdit={handleEdgeEdit}
          onDelete={handleEdgeDelete}
          deleting={deletingEdgeId === selectedEdge?.id}
        />

        {/* Modals */}
        <NetworkNodeFormModal
          isOpen={isNodeModalOpen}
          onClose={() => {
            setIsNodeModalOpen(false)
            setEditingNode(null)
          }}
          onSubmit={handleNodeSubmit}
          initialData={editingNode}
          submitting={submittingNode}
          error={submitNodeError}
          indoorRoutes={indoorRoutes}
        />

        <NetworkEdgeFormModal
          isOpen={isEdgeModalOpen}
          onClose={() => {
            setIsEdgeModalOpen(false)
            setEditingEdge(null)
          }}
          onSubmit={handleEdgeSubmit}
          initialData={editingEdge}
          submitting={submittingEdge}
          error={submitEdgeError}
          indoorRoutes={indoorRoutes}
          nodes={nodes}
        />
      </div>
    </ConfigProvider>
  )
}
