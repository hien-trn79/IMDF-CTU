import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import { GridlineType, type IndoorRouteResponse } from '../../model/IndoorRoute.model'
import type { GridLineRequest } from '../../model/GridLine.model'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import { gridLineService } from '../../services/gridLineService'
import { indoorRouteService } from '../../services/indoorRouteService'
import { networkEdgeService } from '../../services/networkEdgeService'
import { networkNodeService } from '../../services/networkNodeService'
import { normalizeTopology } from '../../utils/topologyUtils'
import { calcPolylineLengthMeters, formatLength } from '../../utils/wkbUtils'

interface ModalAddIndoorProps {
  onClose: () => void
  isOpen: boolean
  coordinates: [number, number][]
  drawing: boolean
  snapEnabled: boolean
  onDrawingChange: (drawing: boolean) => void
  onClearCoordinates: () => void
  onSnapChange: (enabled: boolean) => void
  onCreated: () => void
  nodes: NetworkNodeResponse[]
  edges: NetworkEdgeResponse[]
  token: string
}

export default function ModalAddIndoor({
  onClose,
  isOpen,
  coordinates,
  drawing,
  snapEnabled,
  onDrawingChange,
  onClearCoordinates,
  onSnapChange,
  onCreated,
  nodes,
  edges,
  token,
}: ModalAddIndoorProps) {
  const [data, setData] = useState<GridLineRequest>({
    category: GridlineType.CORRIDOR,
    isOneWay: false,
    indoorRouteId: 0,
    geom: '',
  })
  const [routes, setRoutes] = useState<IndoorRouteResponse[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topologySummary, setTopologySummary] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    indoorRouteService
      .getAll(token)
      .then(setRoutes)
      .catch((routeError: unknown) => {
        setError(routeError instanceof Error ? routeError.message : 'Không tải được danh sách tuyến đường')
      })
  }, [isOpen, token])

  const createGridlineAndTopology = async () => {
    setError(null)
    setTopologySummary(null)

    if (coordinates.length < 2) {
      setError('Cần vẽ ít nhất hai điểm trên bản đồ để tạo đường đi.')
      return
    }
    if (!data.indoorRouteId) {
      setError('Vui lòng chọn Tuyến đường (Indoor Route) liên kết.')
      return
    }

    setSaving(true)
    try {
      // 1. Thực hiện Chuẩn hóa Topology (Tính giao cắt, tách Edge cũ, tạo Node mới, tách Edge mới)
      const topoResult = normalizeTopology(coordinates, nodes, edges, data.indoorRouteId, data.isOneWay)

      // Map lưu tempId -> realNodeId
      const nodeMap = new Map<string | number, number>()

      // 2. Tạo các NetworkNodes mới
      for (const nodeReq of topoResult.nodesToCreate) {
        const createdNode = await networkNodeService.create(
          {
            geom: nodeReq.geom,
            isConnector: nodeReq.isConnector,
            indoorRouteId: nodeReq.indoorRouteId,
          },
          token
        )
        nodeMap.set(nodeReq.tempId, createdNode.id)
      }

      // 3. Xóa các Edge cũ bị tách giao cắt
      for (const edgeIdToDelete of topoResult.edgesToDelete) {
        await networkEdgeService.delete(edgeIdToDelete, token)
      }

      // 4. Tạo các Edge mới (chuẩn hóa topology)
      for (const edgeReq of topoResult.edgesToCreate) {
        const sourceId = typeof edgeReq.source === 'string' ? nodeMap.get(edgeReq.source)! : edgeReq.source
        const targetId = typeof edgeReq.target === 'string' ? nodeMap.get(edgeReq.target)! : edgeReq.target

        if (!sourceId || !targetId || sourceId === targetId) continue

        await networkEdgeService.create(
          {
            source: sourceId,
            target: targetId,
            cost: edgeReq.cost,
            reverseCost: edgeReq.reverseCost,
            geometry: edgeReq.geometry,
            indoorRouteId: edgeReq.indoorRouteId,
          },
          token
        )
      }

      // 5. Tạo đường GridLine mới
      await gridLineService.create(
        {
          ...data,
          geom: topoResult.gridLineGeomHex,
        },
        token
      )

      setTopologySummary(
        `Đã chuẩn hóa topology thành công: Tạo ${topoResult.nodesToCreate.length} node mới, ${topoResult.edgesToCreate.length} edge mới${
          topoResult.edgesToDelete.length > 0 ? `, tách ${topoResult.edgesToDelete.length} edge cũ` : ''
        }.`
      )

      setTimeout(() => {
        onCreated()
      }, 600)
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu và chuẩn hóa đường đi mới.')
    } finally {
      setSaving(false)
    }
  }

  const lengthMeters = coordinates.length >= 2 ? calcPolylineLengthMeters(coordinates) : 0

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="text-emerald-600 font-bold">✏️</span>
          <span>Thêm đường đi GridLine & Chuẩn hóa Topology</span>
        </div>
      }
      open={isOpen}
      onOk={createGridlineAndTopology}
      okText={saving ? 'Đang chuẩn hóa & Lưu...' : 'Lưu đường đi'}
      cancelText="Đóng"
      confirmLoading={saving}
      mask={false}
      onCancel={onClose}
      wrapClassName="!pointer-events-none"
      modalRender={(modal) => <div className="pointer-events-auto">{modal}</div>}
      style={{ top: 20, marginRight: 20, marginLeft: 'auto', width: 420, maxWidth: 'calc(100vw - 32px)' }}
    >
      <div className="space-y-3 pt-1">
        <div className="rounded-lg bg-sky-50/80 p-2.5 border border-sky-100 text-xs text-sky-900 leading-relaxed">
          <p className="font-semibold flex items-center gap-1 text-sky-800 mb-1">
            💡 QGIS Snapping & Chuẩn hóa Topology
          </p>
          <span>
            Bật chế độ vẽ và click lên bản đồ. Điểm vẽ sẽ tự động <strong>hút vào node, đỉnh hoặc cạnh đường hiện tại (QGIS style)</strong>. 
            Sau khi lưu, đường đi sẽ được <strong>tự động cắt và liên kết node/edge</strong> thành 1 topology chuẩn.
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              drawing
                ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700'
                : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
            }`}
            onClick={() => onDrawingChange(!drawing)}
          >
            <span>{drawing ? '⏹ Dừng vẽ' : '✏️ Bắt đầu vẽ'}</span>
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              snapEnabled
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => onSnapChange(!snapEnabled)}
          >
            🧲 Hút điểm (Snap): {snapEnabled ? 'BẬT' : 'TẮT'}
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            onClick={() => {
              onDrawingChange(false)
              onClearCoordinates()
            }}
            disabled={coordinates.length === 0}
          >
            🗑️ Xóa đường
          </button>
        </div>

        <div className="rounded-lg bg-slate-100/80 px-3 py-2 text-xs flex justify-between items-center text-slate-700">
          <span>Số điểm đã chọn: <strong>{coordinates.length}</strong></span>
          <span>Độ dài: <strong className="text-emerald-700">{formatLength(lengthMeters)}</strong></span>
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-700">
            Phân loại (Category)
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-500 focus:outline-none"
              value={data.category}
              onChange={(event) => setData({ ...data, category: event.target.value as GridlineType })}
            >
              {Object.values(GridlineType).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={data.isOneWay}
              onChange={(event) => setData({ ...data, isOneWay: event.target.checked })}
            />
            Đường một chiều (One-Way)
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Tuyến đường trong nhà (Indoor Route) <span className="text-rose-500">*</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-500 focus:outline-none"
              value={data.indoorRouteId || ''}
              onChange={(event) => setData({ ...data, indoorRouteId: Number(event.target.value) })}
            >
              <option value="">-- Chọn tuyến đường liên kết --</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.indoorRouteName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">{error}</div>}
        {topologySummary && (
          <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200">
            {topologySummary}
          </div>
        )}
      </div>
    </Modal>
  )
}
