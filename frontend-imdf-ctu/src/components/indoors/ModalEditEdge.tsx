import { Modal, Popconfirm } from 'antd'
import { useEffect, useState } from 'react'
import type {
  NetworkEdgeRequest,
  NetworkEdgeResponse,
} from '../../model/route models/NetworkEdge.model'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'
import { networkEdgeService } from '../../services/networkEdgeService'
import { indoorRouteService } from '../../services/indoorRouteService'
import {
  parseWKBHexToCoords,
  calcPolylineLengthMeters,
  coordsToLineStringGeometry,
  formatLength,
} from '../../utils/wkbUtils'

interface ModalEditEdgeProps {
  isOpen: boolean
  onClose: () => void
  edge: NetworkEdgeResponse | null
  token: string
  levelId: number | null
  onUpdated: () => void
  onDeleted: (id: number) => void
}

export default function ModalEditEdge({
  isOpen,
  onClose,
  edge,
  token,
  levelId,
  onUpdated,
  onDeleted,
}: ModalEditEdgeProps) {
  const [data, setData] = useState<NetworkEdgeRequest>({
    source: 0,
    target: 0,
    cost: 1,
    reverseCost: -1,
    geometry: { type: 'LineString', coordinates: [] },
    indoorRouteId: 0,
  })
  const [routes, setRoutes] = useState<IndoorRouteResponse[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const coords = edge ? parseWKBHexToCoords(edge.geometryWkb) : []
  const lengthMeters = coords.length >= 2 ? calcPolylineLengthMeters(coords) : 0

  useEffect(() => {
    if (!isOpen || levelId === null) return
    indoorRouteService
      .getAll(token, levelId)
      .then(setRoutes)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Không tải được danh sách tuyến đường')
      )

    if (edge) {
      setData({
        source: edge.source,
        target: edge.target,
        cost: edge.cost,
        reverseCost: edge.reverseCost,
        geometry: coordsToLineStringGeometry(parseWKBHexToCoords(edge.geometryWkb)),
        indoorRouteId: edge.indoorRouteId,
      })
      setError(null)
    }
  }, [isOpen, edge, levelId, token])

  const handleSave = async () => {
    setError(null)
    if (!edge) return
    if (!data.indoorRouteId) {
      setError('Vui lòng chọn tuyến đường liên kết.')
      return
    }
    setSaving(true)
    try {
      await networkEdgeService.update(Number(edge.id), data, token)
      onUpdated()
      onClose()
    } catch (saveErr: unknown) {
      setError(saveErr instanceof Error ? saveErr.message : 'Không thể cập nhật Edge.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="text-purple-600 font-bold">🔗</span>
          <span>Chỉnh sửa Network Edge (ID: {edge?.id})</span>
        </div>
      }
      open={isOpen}
      onOk={handleSave}
      okText={saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      cancelText="Hủy"
      confirmLoading={saving}
      onCancel={onClose}
      className="top-6"
    >
      <div className="space-y-3 pt-1 text-xs">
        {/* Info summary */}
        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700 flex justify-between">
          <span>
            Source: <strong className="text-blue-700">{edge?.source}</strong> → Target:{' '}
            <strong className="text-blue-700">{edge?.target}</strong>
          </span>
          <span>
            Độ dài: <strong className="text-purple-700">{formatLength(lengthMeters)}</strong>
          </span>
        </div>

        {/* Source / Target (read-only display) */}
        <div className="flex gap-2">
          <label className="flex-1 block font-semibold text-slate-700">
            Node Source
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-slate-50 focus:border-purple-500 focus:outline-none"
              value={data.source}
              onChange={(e) => setData({ ...data, source: Number(e.target.value) })}
            />
          </label>
          <label className="flex-1 block font-semibold text-slate-700">
            Node Target
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-slate-50 focus:border-purple-500 focus:outline-none"
              value={data.target}
              onChange={(e) => setData({ ...data, target: Number(e.target.value) })}
            />
          </label>
        </div>

        {/* Cost / Reverse Cost */}
        <div className="flex gap-2">
          <label className="flex-1 block font-semibold text-slate-700">
            Cost (chi phí)
            <input
              type="number"
              step="any"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-purple-500 focus:outline-none"
              value={data.cost}
              onChange={(e) => setData({ ...data, cost: Number(e.target.value) })}
            />
          </label>
          <label className="flex-1 block font-semibold text-slate-700">
            Reverse Cost
            <input
              type="number"
              step="any"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-purple-500 focus:outline-none"
              value={data.reverseCost}
              onChange={(e) => setData({ ...data, reverseCost: Number(e.target.value) })}
            />
          </label>
        </div>

        {/* Indoor Route */}
        <label className="block font-semibold text-slate-700">
          Tuyến đường trong nhà (Indoor Route) <span className="text-rose-500">*</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-purple-500 focus:outline-none"
            value={data.indoorRouteId || ''}
            onChange={(e) => setData({ ...data, indoorRouteId: Number(e.target.value) })}
          >
            <option value="">-- Chọn tuyến đường --</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.indoorRouteName}
              </option>
            ))}
          </select>
        </label>

        {/* Geometry WKB */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
          <p className="font-semibold text-slate-500 mb-1">
            WKB Hex (geometry) — {coords.length} điểm
          </p>
          <p className="break-all text-[10px] text-slate-400 font-mono">{edge?.geometryWkb ?? '—'}</p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-2 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
          <Popconfirm
            title="Xóa Edge này?"
            description="Thao tác này không thể hoàn tác."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => {
              if (edge) onDeleted(Number(edge.id))
              onClose()
            }}
          >
            <button type="button" className="text-rose-600 font-semibold hover:underline text-xs">
              🗑️ Xóa Edge này
            </button>
          </Popconfirm>
        </div>
      </div>
    </Modal>
  )
}
