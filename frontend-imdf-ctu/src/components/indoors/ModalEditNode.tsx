import { Modal, Popconfirm } from 'antd'
import { useEffect, useState } from 'react'
import type {
  NetworkNodeRequest,
  NetworkNodeResponse,
} from '../../model/route models/NetworkNode.model'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'
import { networkNodeService } from '../../services/networkNodeService'
import { indoorRouteService } from '../../services/indoorRouteService'
import { wkbHexToPoint } from '../../utils/wkbParser'
import { coordToPointGeometry } from '../../utils/wkbUtils'

interface ModalEditNodeProps {
  isOpen: boolean
  onClose: () => void
  node: NetworkNodeResponse | null
  token: string
  levelId: number | null
  onUpdated: () => void
  onDeleted: (id: number) => void
}

export default function ModalEditNode({
  isOpen,
  onClose,
  node,
  token,
  levelId,
  onUpdated,
  onDeleted,
}: ModalEditNodeProps) {
  const [data, setData] = useState<NetworkNodeRequest>({
    isConnector: false,
    geometry: { type: 'Point', coordinates: [0, 0] },
    indoorRouteId: 0,
  })
  const [routes, setRoutes] = useState<IndoorRouteResponse[]>([])
  const [coord, setCoord] = useState<[number, number] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || levelId === null) return
    indoorRouteService
      .getAll(token, levelId)
      .then(setRoutes)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Không tải được danh sách tuyến đường')
      )

    if (node) {
      const pt = wkbHexToPoint(node.geom)
      setCoord(pt ?? null)
      setData({
        isConnector: node.isConnector ?? false,
        geometry: pt ? coordToPointGeometry(pt) : { type: 'Point', coordinates: [0, 0] },
        indoorRouteId: node.indoorRouteId,
      })
      setError(null)
    }
  }, [isOpen, node, levelId, token])

  const handleSave = async () => {
    setError(null)
    if (!node) return
    if (!data.indoorRouteId) {
      setError('Vui lòng chọn tuyến đường liên kết.')
      return
    }
    setSaving(true)
    try {
      const geometry = coord ? coordToPointGeometry(coord) : data.geometry
      await networkNodeService.update(Number(node.id), { ...data, geometry }, token)
      onUpdated()
      onClose()
    } catch (saveErr: unknown) {
      setError(saveErr instanceof Error ? saveErr.message : 'Không thể cập nhật Node.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="text-blue-600 font-bold">📍</span>
          <span>Chỉnh sửa Network Node (ID: {node?.id})</span>
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
        {/* Tọa độ */}
        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700 space-y-1">
          <p className="font-semibold text-slate-600 mb-1">Tọa độ (Longitude, Latitude)</p>
          <div className="flex gap-2">
            <label className="flex-1 block">
              <span className="text-slate-500">Kinh độ (Lng)</span>
              <input
                type="number"
                step="any"
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                value={coord?.[0] ?? ''}
                onChange={(e) => setCoord([Number(e.target.value), coord?.[1] ?? 0])}
              />
            </label>
            <label className="flex-1 block">
              <span className="text-slate-500">Vĩ độ (Lat)</span>
              <input
                type="number"
                step="any"
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                value={coord?.[1] ?? ''}
                onChange={(e) => setCoord([coord?.[0] ?? 0, Number(e.target.value)])}
              />
            </label>
          </div>
        </div>

        {/* Is Connector */}
        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={data.isConnector}
            onChange={(e) => setData({ ...data, isConnector: e.target.checked })}
          />
          Node kết nối tầng (Connector)
        </label>

        {/* Indoor Route */}
        <label className="block font-semibold text-slate-700">
          Tuyến đường trong nhà (Indoor Route) <span className="text-rose-500">*</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
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

        {/* WKB Raw */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
          <p className="font-semibold text-slate-500 mb-1">WKB Hex (geometry hiện tại)</p>
          <p className="break-all text-[10px] text-slate-400 font-mono">{node?.geom ?? '—'}</p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-2 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
          <Popconfirm
            title="Xóa Node này?"
            description="Thao tác này không thể hoàn tác. Các edge liên kết cũng có thể bị ảnh hưởng."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => {
              if (node) onDeleted(Number(node.id))
              onClose()
            }}
          >
            <button type="button" className="text-rose-600 font-semibold hover:underline text-xs">
              🗑️ Xóa Node này
            </button>
          </Popconfirm>
        </div>
      </div>
    </Modal>
  )
}
