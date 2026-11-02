import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import type { UnitGeoJson } from '../../model/geoJsonEntity.model'
import { authHeaders } from '../../services/authHeaders'
import { unitService } from '../../services/unitService'
import type { OutdoorFeatureItem } from './OutdoorTable'
import type { LevelGeoJson } from '../../model/geoJsonEntity.model'

interface FeatureOption {
  id: number
  featureType: string
}

interface AmenityCategoryOption {
  amenityCateId: number
  amenityCateName: string
  amenityVietNameseName: string
}

interface AmenityEditModalProps {
  open: boolean
  item: OutdoorFeatureItem | null
  token?: string | null
  units: UnitGeoJson['features']
  levels: Array<LevelGeoJson['features'][number]>
  selectedLevelId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function AmenityEditModal({
  open,
  item,
  token,
  units,
  levels,
  selectedLevelId,
  onClose,
  onSaved,
}: AmenityEditModalProps) {
  const [data, setData] = useState({
    amenityName: '',
    phone: '',
    website: '',
    hours: '',
    amenityCategoryId: 0,
    featureId: 0,
    unitId: 0,
    levelId: 0,
  })
  const [featureOptions, setFeatureOptions] = useState<FeatureOption[]>([])
  const [categoryOptions, setCategoryOptions] = useState<AmenityCategoryOption[]>([])
  const [geometryText, setGeometryText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const loadOptions = async () => {
      try {
        const headers = authHeaders(token ?? '')
        const [featureResponse, categoryResponse] = await Promise.all([
          fetch('http://localhost:8081/api/features', {
            headers,
            signal: controller.signal,
          }),
          fetch('http://localhost:8081/api/amenity-categories', {
            headers,
            signal: controller.signal,
          }),
        ])
        if (!featureResponse.ok) {
          throw new Error(`Không tải được Feature (HTTP ${featureResponse.status}).`)
        }
        if (!categoryResponse.ok) {
          throw new Error(`Không tải được Amenity category (HTTP ${categoryResponse.status}).`)
        }
        setFeatureOptions((await featureResponse.json()) as FeatureOption[])
        setCategoryOptions((await categoryResponse.json()) as AmenityCategoryOption[])
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
      amenityName: String(properties.amenityName ?? ''),
      phone: String(properties.phone ?? ''),
      website: String(properties.website ?? ''),
      hours: properties.hours ? String(properties.hours).slice(0, 16) : '',
      amenityCategoryId: Number(properties.amenityCategoryId ?? properties.amenityCateId ?? 0),
      featureId: Number(properties.featureId ?? 0),
      unitId: Number(properties.unitId ?? 0),
      levelId: Number(properties.levelId ?? selectedLevelId ?? 0),
    })
    setGeometryText(JSON.stringify(item.feature.geometry, null, 2))
    setError(null)
  }, [item, selectedLevelId])

  const update = (key: keyof typeof data, value: string | number) =>
    setData((current) => ({ ...current, [key]: value }))

  const handleSave = async () => {
    if (!item) return
    setError(null)
    if (!data.amenityName.trim()) return setError('Tên Amenity không được để trống.')
    if (!data.featureId || !data.unitId || !data.levelId || !data.amenityCategoryId) {
      return setError('Vui lòng nhập đầy đủ Feature, Unit, Level và Category ID.')
    }
    setSaving(true)
    try {
      const response = await fetch(`http://localhost:8081/api/amenities/${item.feature.id}`, {
        method: 'PUT',
        headers: authHeaders(token ?? '', true),
        body: JSON.stringify({
          ...data,
          geometry: unitService.parseGeometry(geometryText, 'Geometry'),
          hours: data.hours || null,
        }),
      })
      if (!response.ok) throw new Error(`Cập nhật Amenity thất bại (HTTP ${response.status}).`)
      onSaved()
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật Amenity.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Chỉnh sửa Amenity (ID: ${item?.feature.id ?? '—'})`} open={open}
      onCancel={onClose} onOk={handleSave} confirmLoading={saving} okText="Lưu" width={720}>
      <div className="space-y-3 text-xs">
        <label className="block font-semibold">Tên Amenity
          <input value={data.amenityName} onChange={(e) => update('amenityName', e.target.value)}
            className="mt-1 w-full rounded border p-2" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['phone', 'website'] as const).map((key) => (
            <label key={key} className="font-semibold">{key}
              <input value={data[key]} onChange={(e) => update(key, e.target.value)}
                className="mt-1 w-full rounded border p-2" />
            </label>
          ))}
        </div>
        <label className="block font-semibold">Feature Type
          <select value={data.featureId || ''} onChange={(e) => update('featureId', Number(e.target.value))}
            className="mt-1 w-full rounded border bg-white p-2">
            <option value="">Chọn Feature</option>
            {featureOptions.map((feature) => <option key={feature.id} value={feature.id}>
              {feature.id} - {feature.featureType}
            </option>)}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="font-semibold">Unit
            <select value={data.unitId || ''} onChange={(e) => update('unitId', Number(e.target.value))}
              className="mt-1 w-full rounded border bg-white p-2">
              <option value="">Chọn Unit</option>
              {units.map((unit) => <option key={unit.id} value={unit.id}>
                {unit.id} - {unit.properties.unitName}
              </option>)}
            </select>
          </label>
          <label className="font-semibold">Level
            <select value={data.levelId || ''} onChange={(e) => update('levelId', Number(e.target.value))}
              className="mt-1 w-full rounded border bg-white p-2">
              <option value="">Chọn tầng</option>
              {levels.map((level) => <option key={level.id} value={level.id}>
                {level.id} - Tầng {level.properties.ordinal}
              </option>)}
            </select>
          </label>
          <label className="font-semibold">Amenity category
            <select value={data.amenityCategoryId || ''}
              onChange={(e) => update('amenityCategoryId', Number(e.target.value))}
              className="mt-1 w-full rounded border bg-white p-2">
              <option value="">Chọn category</option>
              {categoryOptions.map((category) => (
                <option key={category.amenityCateId} value={category.amenityCateId}>
                  {category.amenityCateName} - {category.amenityVietNameseName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block font-semibold">Geometry (GeoJSON)
          <textarea value={geometryText} onChange={(e) => setGeometryText(e.target.value)}
            rows={5} className="mt-1 w-full rounded border p-2 font-mono text-[11px]" />
        </label>
        {error && <p className="rounded border border-rose-200 bg-rose-50 p-2 text-rose-600">{error}</p>}
      </div>
    </Modal>
  )
}
