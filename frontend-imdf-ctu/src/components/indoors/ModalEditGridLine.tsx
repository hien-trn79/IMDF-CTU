import { Modal, Popconfirm } from 'antd'
import { useEffect, useState } from 'react'
import { GridlineType, type IndoorRouteResponse } from '../../model/IndoorRoute.model'
import type { GridLineRequest } from '../../model/GridLine.model'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import { gridLineService } from '../../services/gridLineService'
import { indoorRouteService } from '../../services/indoorRouteService'
import { lineStringToWkbHex } from '../../utils/wkbEncoder'
import { parseWKBHexToCoords, calcPolylineLengthMeters, formatLength } from '../../utils/wkbUtils'

interface ModalEditGridLineProps {
  isOpen: boolean
  onClose: () => void
  gridLineItem: any // IndoorFeatureItem
  token: string
  nodes: NetworkNodeResponse[]
  edges: NetworkEdgeResponse[]
  onUpdated: () => void
  onDelete: (id: number) => void
}

export default function ModalEditGridLine({
  isOpen,
  onClose,
  gridLineItem,
  token,
  onUpdated,
  onDelete,
}: ModalEditGridLineProps) {
  const [data, setData] = useState<GridLineRequest>({
    category: GridlineType.CORRIDOR,
    isOneWay: false,
    indoorRouteId: 0,
    geom: '',
  })
  const [coords, setCoords] = useState<[number, number][]>([])
  const [routes, setRoutes] = useState<IndoorRouteResponse[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const featureProps = gridLineItem?.feature?.properties || {}
  const gridLineId = gridLineItem?.feature?.id ? Number(gridLineItem.feature.id) : null

  useEffect(() => {
    if (!isOpen) return
    indoorRouteService
      .getAll(token)
      .then(setRoutes)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được danh sách tuyến đường'))

    if (gridLineItem?.feature) {
      const categoryVal = featureProps.category || GridlineType.CORRIDOR
      const isOneWayVal = !!featureProps.isOneWay
      const indoorRouteIdVal = Number(featureProps.indoorRouteId || featureProps.indoor_route_id || 0)
      const geomHex = gridLineItem.feature.geometry_wkb || gridLineItem.feature.geom || ''
      const parsed = parseWKBHexToCoords(geomHex)

      setData({
        category: categoryVal as GridlineType,
        isOneWay: isOneWayVal,
        indoorRouteId: indoorRouteIdVal,
        geom: geomHex,
      })
      setCoords(parsed.length > 0 ? parsed : (gridLineItem.feature.geometry?.coordinates || []))
    }
  }, [isOpen, gridLineItem, token])

  const handleSave = async () => {
    setError(null)
    if (!gridLineId) {
      setError('ID Gridline không hợp lệ.')
      return
    }
    if (!data.indoorRouteId) {
      setError('Vui lòng chọn tuyến đường liên kết.')
      return
    }

    setSaving(true)
    try {
      const finalGeomHex = coords.length >= 2 ? lineStringToWkbHex(coords) : data.geom
      await gridLineService.update(gridLineId, { ...data, geom: finalGeomHex }, token)
      onUpdated()
      onClose()
    } catch (saveErr: unknown) {
      setError(saveErr instanceof Error ? saveErr.message : 'Không thể cập nhật Gridline.')
    } finally {
      setSaving(false)
    }
  }

  const lengthMeters = coords.length >= 2 ? calcPolylineLengthMeters(coords) : 0

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="text-blue-600 font-bold">✏️</span>
          <span>Chỉnh sửa GridLine (ID: {gridLineId})</span>
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
        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700 flex justify-between items-center">
          <span>Tọa độ: <strong>{coords.length} điểm</strong></span>
          <span>Độ dài: <strong className="text-blue-700">{formatLength(lengthMeters)}</strong></span>
        </div>

        <label className="block font-semibold text-slate-700">
          Phân loại (Category)
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
            value={data.category}
            onChange={(e) => setData({ ...data, category: e.target.value as GridlineType })}
          >
            {Object.values(GridlineType).map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={data.isOneWay}
            onChange={(e) => setData({ ...data, isOneWay: e.target.checked })}
          />
          Đường một chiều (One-Way)
        </label>

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

        {error && <div className="rounded-lg bg-rose-50 p-2 text-rose-600 border border-rose-200">{error}</div>}

        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
          <Popconfirm
            title="Xóa Gridline này?"
            description="Thao tác này không thể hoàn tác."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => {
              if (gridLineId) onDelete(gridLineId)
              onClose()
            }}
          >
            <button type="button" className="text-rose-600 font-semibold hover:underline">
              🗑️ Xóa Gridline này
            </button>
          </Popconfirm>
        </div>
      </div>
    </Modal>
  )
}
