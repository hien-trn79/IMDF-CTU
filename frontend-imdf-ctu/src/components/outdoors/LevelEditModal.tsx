import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import { authHeaders } from '../../services/authHeaders'
import { unitService } from '../../services/unitService'
import type { OutdoorFeatureItem } from './OutdoorTable'

interface Option {
  id: number
  name: string
}

interface LevelEditModalProps {
  open: boolean
  item: OutdoorFeatureItem | null
  token?: string | null
  onClose: () => void
  onSaved: () => void
}

export default function LevelEditModal({ open, item, token, onClose, onSaved }: LevelEditModalProps) {
  const [data, setData] = useState({
    outdoor: false, ordinal: 0, levelCategoryId: 0, restrictionCategoryId: 0, buildingId: 0,
  })
  const [geometryText, setGeometryText] = useState('')
  const [displayPointText, setDisplayPointText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [levelCategories, setLevelCategories] = useState<Option[]>([])
  const [restrictionCategories, setRestrictionCategories] = useState<Option[]>([])
  const [buildings, setBuildings] = useState<Option[]>([])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const loadOptions = async () => {
      try {
        const requests = [
          ['http://localhost:8081/api/level-categories', setLevelCategories],
          ['http://localhost:8081/api/restriction-categories', setRestrictionCategories],
          ['http://localhost:8081/api/buildings?page=0&size=100&sort=id%2CASC', setBuildings],
        ] as const
        await Promise.all(requests.map(async ([url, setter]) => {
          const response = await fetch(url, {
            headers: authHeaders(token ?? ''),
            signal: controller.signal,
          })
          if (!response.ok) throw new Error(`Không tải được dữ liệu lựa chọn (HTTP ${response.status}).`)
          const body = await response.json()
          const rows = Array.isArray(body)
            ? body
            : body.features ?? body.content ?? body.data?.content ?? body.data?.features ?? []
          setter(rows.map((row: any) => ({
            id: Number(row.id ?? row.properties?.id),
            name: String(
              row.levelCategoryVietnameseName ??
                row.levelCategoryName ??
                row.restrictionCateVietnameseName ??
                row.restrictionCateName ??
                row.buildingName ??
                row.properties?.buildingName ??
                row.name ??
                row.id
            ),
          })))
        }))
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu lựa chọn.')
        }
      }
    }
    loadOptions()
    return () => controller.abort()
  }, [open, token])

  useEffect(() => {
    if (!item) return
    const properties = item.feature.properties ?? {}
    setData({
      outdoor: Boolean(properties.outdoor),
      ordinal: Number(properties.ordinal ?? 0),
      levelCategoryId: Number(properties.levelCategoryId ?? 0),
      restrictionCategoryId: Number(properties.restrictionCategoryId ?? 0),
      buildingId: Number(properties.buildingId ?? 0),
    })
    setGeometryText(JSON.stringify(item.feature.geometry, null, 2))
    setDisplayPointText(JSON.stringify(properties.displayPoint ?? { type: 'Point', coordinates: [] }, null, 2))
    setError(null)
  }, [item])

  const update = (key: keyof typeof data, value: boolean | number) =>
    setData((current) => ({ ...current, [key]: value }))

  const handleSave = async () => {
    if (!item) return
    setError(null)
    if (!data.levelCategoryId || !data.restrictionCategoryId || !data.buildingId) {
      return setError('Vui lòng nhập đầy đủ Category và Building ID.')
    }
    setSaving(true)
    try {
      const response = await fetch(`http://localhost:8081/api/levels/${item.feature.id}`, {
        method: 'PUT',
        headers: authHeaders(token ?? '', true),
        body: JSON.stringify({
          ...data,
          geometry: unitService.parseGeometry(geometryText, 'Geometry'),
          displayPoint: unitService.parseGeometry(displayPointText, 'Display point'),
        }),
      })
      if (!response.ok) throw new Error(`Cập nhật Level thất bại (HTTP ${response.status}).`)
      onSaved()
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật Level.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Chỉnh sửa Level (ID: ${item?.feature.id ?? '—'})`} open={open}
      onCancel={onClose} onOk={handleSave} confirmLoading={saving} okText="Lưu" width={720}>
      <div className="space-y-3 text-xs">
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={data.outdoor} onChange={(e) => update('outdoor', e.target.checked)} />
          Outdoor
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="font-semibold">Ordinal
            <input type="number" value={data.ordinal || ''} onChange={(e) => update('ordinal', Number(e.target.value) || 0)}
              className="mt-1 w-full rounded border p-2" />
          </label>
          {([
            ['levelCategoryId', 'Level category', levelCategories],
            ['restrictionCategoryId', 'Restriction category', restrictionCategories],
            ['buildingId', 'Building', buildings],
          ] as const).map(([key, label, options]) => (
            <label key={key} className="font-semibold">{label}
              <select value={data[key] || ''} onChange={(e) => update(key, Number(e.target.value))}
                className="mt-1 w-full rounded border bg-white p-2">
                <option value="">Chọn {label}</option>
                {options.map((option) => <option key={option.id} value={option.id}>
                  {option.id} - {option.name}
                </option>)}
              </select>
            </label>
          ))}
        </div>
        <label className="block font-semibold">Geometry (GeoJSON)
          <textarea value={geometryText} onChange={(e) => setGeometryText(e.target.value)}
            rows={6} className="mt-1 w-full rounded border p-2 font-mono text-[11px]" />
        </label>
        <label className="block font-semibold">Display point (GeoJSON)
          <textarea value={displayPointText} onChange={(e) => setDisplayPointText(e.target.value)}
            rows={4} className="mt-1 w-full rounded border p-2 font-mono text-[11px]" />
        </label>
        {error && <p className="rounded border border-rose-200 bg-rose-50 p-2 text-rose-600">{error}</p>}
      </div>
    </Modal>
  )
}
