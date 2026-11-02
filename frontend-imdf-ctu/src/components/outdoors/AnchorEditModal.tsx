import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import type { AnchorRequestPayload } from '../../model/IndoorRoute.model'
import type { UnitGeoJson } from '../../model/geoJsonEntity.model'
import type { OutdoorFeatureItem } from './OutdoorTable'
import { authHeaders } from '../../services/authHeaders'
import { unitService } from '../../services/unitService'

interface AnchorEditModalProps {
  open: boolean
  item: OutdoorFeatureItem | null
  anchorId: string | null
  token?: string | null
  units: UnitGeoJson['features']
  onClose: () => void
  onSaved: () => void
}

interface FeatureOption {
  id: number
  featureId: string
  featureType: string
}

const emptyPayload: AnchorRequestPayload = {
  anchorName: '',
  geometry: { type: 'MultiPolygon', coordinates: [] },
  featureId: null,
  unitId: 0,
}

export default function AnchorEditModal({
  open,
  item,
  anchorId,
  token,
  units,
  onClose,
  onSaved,
}: AnchorEditModalProps) {
  const [data, setData] = useState(emptyPayload)
  const [geometryText, setGeometryText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featureOptions, setFeatureOptions] = useState<FeatureOption[]>([])
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const loadFeatures = async () => {
      setIsLoadingFeatures(true)
      try {
        const response = await fetch('http://localhost:8081/api/features', {
          headers: authHeaders(token ?? ''),
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Không tải được danh sách Feature (HTTP ${response.status}).`)
        setFeatureOptions((await response.json()) as FeatureOption[])
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách Feature.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingFeatures(false)
      }
    }
    loadFeatures()
    return () => controller.abort()
  }, [open, token])

  useEffect(() => {
    if (!item) return
    const properties = item.feature.properties ?? {}
    const currentFeature = featureOptions.find(
      (feature) => String(feature.featureId) === String(properties.featureId)
    )
    setData({
      anchorName: String(properties.anchorName ?? properties.name ?? ''),
      geometry: item.feature.geometry,
      featureId: currentFeature?.id ?? 0,
      unitId: Number(properties.unitId ?? 0),
    })
    setGeometryText(JSON.stringify(item.feature.geometry, null, 2))
    setError(null)
  }, [item, anchorId, featureOptions])

  const update = <K extends keyof AnchorRequestPayload>(key: K, value: AnchorRequestPayload[K]) =>
    setData((current) => ({ ...current, [key]: value }))

  const handleSave = async () => {
    if (!item) return
    setError(null)

    if (!anchorId) {
      setError('Không xác định được Anchor cần cập nhật.')
      return
    }
    if (!data.anchorName.trim()) {
      setError('Tên của Anchor không được để trống.')
      return
    }
    if (!data.unitId || data.unitId <= 0) {
      setError('Unit ID của Anchor không hợp lệ.')
      return
    }
    if (!data.featureId || data.featureId <= 0) {
      setError('Feature Type của Anchor không hợp lệ.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...data,
        geometry: unitService.parseGeometry(geometryText, 'Geometry'),
      }
      const response = await fetch(`http://localhost:8081/api/anchors/${anchorId}`, {
        method: 'PUT',
        headers: authHeaders(token ?? '', true),
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`Cập nhật Anchor thất bại (HTTP ${response.status}).`)
      onSaved()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật Anchor.'
      setError(message)
      console.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Chỉnh sửa Anchor (ID: ${item?.feature.id ?? '—'})`}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="Lưu"
    >
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Tên Anchor
          <input
            value={data.anchorName}
            onChange={(event) => update('anchorName', event.target.value)}
            className="mt-1 h-9 w-full rounded border border-slate-300 px-2"
          />
        </label>
        <label className="block text-sm font-medium">
          Feature Type
          <select
            value={data.featureId || ''}
            disabled={isLoadingFeatures}
            onChange={(event) => update('featureId', Number(event.target.value))}
            className="mt-1 h-9 w-full rounded border border-slate-300 bg-white px-2"
          >
            <option value="">
              {isLoadingFeatures ? 'Đang tải Feature...' : 'Chọn Feature Type'}
            </option>
            {featureOptions.map((feature) => (
              <option key={feature.id} value={feature.id}>
                {feature.id} - {feature.featureType}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Unit ID
          <select
            value={data.unitId || ''}
            onChange={(event) => update('unitId', Number(event.target.value))}
            className="mt-1 h-9 w-full rounded border border-slate-300 bg-white px-2"
          >
            <option value="">Chọn phòng</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.id} - {unit.properties.unitName}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Geometry (GeoJSON)
          <textarea
            value={geometryText}
            onChange={(event) => setGeometryText(event.target.value)}
            rows={7}
            className="mt-1 w-full rounded border border-slate-300 p-2 font-mono text-xs"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
