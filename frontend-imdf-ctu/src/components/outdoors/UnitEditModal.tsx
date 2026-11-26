import { Modal } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { OutdoorFeatureItem } from './OutdoorTable'
import type { UnitRequestPayload } from '../../model/imdf models/Unit.model'
import { unitService } from '../../services/unitService'
import { useDashboard } from '../../context/DashboardContext'
import { useNavigateContext } from '../../context/NavigateContext'

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
  unitCategoryId: 0,
  restrictionCategoryId: 0,
}

export default function UnitEditModal({
  open,
  item,
  levelId,
  token,
  onClose,
  onSaved,
}: UnitEditModalProps) {
  const [data, setData] = useState<UnitRequestPayload>(emptyPayload)
  const [geometryText, setGeometryText] = useState('')
  const [displayPointText, setDisplayPointText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { unitCateData, restrictionCateData } = useDashboard()
  const { levelsData } = useNavigateContext()

  // levelsData là FeatureCollection => lấy từ .features, tên nằm trong properties
  // (đổi tên field cho đúng với Level.model của bạn)
  const levelOptions = useMemo(
    () =>
      (levelsData?.features ?? []).map((level) => {
        const props = (level.properties ?? {}) as Record<string, any>
        return {
          id: Number(level.id),
          label: String(props.levelName ?? props.name ?? `Tầng ${props.ordinal ?? level.id}`),
        }
      }),
    [levelsData]
  )

  useEffect(() => {
    if (!item) return
    const properties = (item.feature.properties ?? {}) as Record<string, any>
    const displayPoint = properties.displayPoint ??
      properties.display_point ?? { type: 'Point', coordinates: [] }

    setData({
      unitName: String(properties.unitName ?? properties.unit_name ?? properties.name ?? ''),
      geometry: item.feature.geometry,
      displayPoint,
      featureId: null,
      levelId: Number(levelId ?? properties.levelId ?? 0) || 0,
      // Giữ 0 nếu thiếu dữ liệu để select hiện "Chọn..." và bắt validate khi lưu
      unitCategoryId: Number(properties.unitCategoryId) || 0,
      restrictionCategoryId: Number(properties.restrictionCategoryId) || 0,
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
    if (!data.unitCategoryId) {
      setError('Vui lòng chọn loại hình Unit.')
      return
    }
    if (!data.restrictionCategoryId) {
      setError('Vui lòng chọn loại hình Restriction.')
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

  const selectClass = 'mt-1 w-full rounded-lg border border-slate-300 p-2'

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
          <label className="font-semibold text-slate-700">
            Tầng
            <select
              className={selectClass}
              value={data.levelId || ''}
              onChange={(event) => update('levelId', Number(event.target.value) || 0)}
            >
              <option value="">Chọn tầng...</option>
              {levelOptions.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>

          <label className="font-semibold text-slate-700">
            Loại hình Unit
            <select
              className={selectClass}
              value={data.unitCategoryId || ''}
              onChange={(event) => update('unitCategoryId', Number(event.target.value) || 0)}
            >
              <option value="">Chọn loại...</option>
              {(unitCateData ?? []).map((cate) => (
                <option key={cate.id} value={cate.id}>
                  {cate.unitCategoryName}
                </option>
              ))}
            </select>
          </label>

          <label className="font-semibold text-slate-700">
            Loại hình Restriction
            <select
              className={selectClass}
              value={data.restrictionCategoryId || ''}
              onChange={(event) => update('restrictionCategoryId', Number(event.target.value) || 0)}
            >
              <option value="">Chọn loại...</option>
              {(restrictionCateData ?? []).map((cate) => (
                <option key={cate.id} value={cate.id}>
                  {cate.restrictionCateName}
                </option>
              ))}
            </select>
          </label>
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
