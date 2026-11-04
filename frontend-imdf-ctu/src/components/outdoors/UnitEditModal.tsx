import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import type { OutdoorFeatureItem } from './OutdoorTable'
import type { UnitRequestPayload } from '../../model/imdf models/Unit.model'
import { unitService } from '../../services/unitService'

interface UnitEditModalProps {
  open: boolean
  item: OutdoorFeatureItem | null
  levelId: string | null
  token?: string | null
  onClose: () => void
  onSaved: () => void
}

const emptyPayload: UnitRequestPayload = {
  unitName: '',
  geometry: { type: 'MultiPolygon', coordinates: [] },
  displayPoint: { type: 'Point', coordinates: [] },
  featureId: null,
  levelId: 0,
  unitCategoryId: 1,
  restrictionCategoryId: 1,
}

export default function UnitEditModal({
  open,
  item,
  levelId,
  token,
  onClose,
  onSaved,
}: UnitEditModalProps) {
  const [data, setData] = useState(emptyPayload)
  const [geometryText, setGeometryText] = useState('')
  const [displayPointText, setDisplayPointText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    const properties = item.feature.properties ?? {}
    const displayPoint = properties.displayPoint ??
      properties.display_point ?? { type: 'Point', coordinates: [] }
    setData({
      unitName: String(properties.unitName ?? properties.name ?? ''),
      geometry: item.feature.geometry,
      displayPoint,
      featureId: null,
      levelId: Number(levelId ?? properties.levelId ?? 0),
      unitCategoryId: Number(properties.unitCategoryId) || 1,
      restrictionCategoryId: Number(properties.restrictionCategoryId) || 1,
    })
    setGeometryText(JSON.stringify(item.feature.geometry, null, 2))
    setDisplayPointText(JSON.stringify(displayPoint, null, 2))
    setError(null)
  }, [item, levelId])

  const update = <K extends keyof UnitRequestPayload>(key: K, value: UnitRequestPayload[K]) =>
    setData((current) => ({ ...current, [key]: value }))

  const handleSave = async () => {
    if (!item) return
    setError(null)
    if (!data.unitName.trim()) {
      setError('Tên Unit không được để trống.')
      return
    }
    if (!data.levelId) {
      setError('Vui lòng chọn tầng trước khi lưu.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...data,
        geometry: unitService.parseGeometry(geometryText, 'Geometry'),
        displayPoint: unitService.parseGeometry(displayPointText, 'Display point'),
      }
      await unitService.update(item.feature.id, payload, token ?? undefined)
      onSaved()
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật Unit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Chỉnh sửa Unit (ID: ${item?.feature.id ?? '—'})`}
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      okText={saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      cancelText="Hủy"
      confirmLoading={saving}
      width={720}
      destroyOnHidden
    >
      <div className="space-y-3 text-xs">
        <label className="block font-semibold text-slate-700">
          Tên Unit
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            value={data.unitName}
            onChange={(event) => update('unitName', event.target.value)}
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['levelId', 'Level ID', data.levelId],
            ['unitCategoryId', 'Unit Category ID', data.unitCategoryId],
            ['restrictionCategoryId', 'Restriction Category ID', data.restrictionCategoryId],
          ].map(([key, label, value]) => (
            <label key={key} className="font-semibold text-slate-700">
              {label}
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                value={value as number}
                onChange={(event) =>
                  update(key as keyof UnitRequestPayload, Number(event.target.value) || 0)
                }
              />
            </label>
          ))}
        </div>
        <label className="block font-semibold text-slate-700">
          Geometry (GeoJSON)
          <textarea
            className="mt-1 h-32 w-full rounded-lg border border-slate-300 p-2 font-mono text-[11px]"
            value={geometryText}
            onChange={(event) => setGeometryText(event.target.value)}
          />
        </label>
        <label className="block font-semibold text-slate-700">
          Display point (GeoJSON)
          <textarea
            className="mt-1 h-24 w-full rounded-lg border border-slate-300 p-2 font-mono text-[11px]"
            value={displayPointText}
            onChange={(event) => setDisplayPointText(event.target.value)}
          />
        </label>
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600">{error}</p>
        )}
      </div>
    </Modal>
  )
}
