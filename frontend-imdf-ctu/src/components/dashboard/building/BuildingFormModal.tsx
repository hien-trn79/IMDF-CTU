import { useEffect, useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import { Loader2, X } from 'lucide-react'
import { useDashboard } from '../../../context/DashboardContext'
import { useUser } from '../../../context/UserContext'
import type { BuildingCategoryResposne, BuildingGeojsonItem } from '../../../model/Building.model'
import { parseBuildingGeoJson, type ParsedBuildingGeoJson } from './buildingGeojson'
import { createBuilding, updateBuilding, type BuildingRequest } from './buildingApi'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface FormValues {
  buildingName: string
  buildingCategoryId: number | ''
  restrictionCategoryId: number | ''
  addressId: number | ''
  featureId: number | ''
}

const INITIAL_VALUES: FormValues = {
  buildingName: '',
  buildingCategoryId: '',
  restrictionCategoryId: '',
  addressId: '',
  featureId: '',
}

interface Props {
  open: boolean
  onClose: () => void
  venueId: number | null
  categories: BuildingCategoryResposne[]
  /** Truyền building để mở ở chế độ chỉnh sửa; bỏ trống là thêm mới */
  building?: BuildingGeojsonItem | null
  /** Gọi sau khi lưu thành công (truyền refetch của danh sách building) */
  onSuccess?: () => void
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'
const labelClass = 'mb-1 block text-sm font-bold text-gray-700'

type ParseState = { ok: true; data: ParsedBuildingGeoJson } | { ok: false; message: string } | null

export default function BuildingFormModal({
  open,
  onClose,
  venueId,
  categories,
  building = null,
  onSuccess,
}: Props) {
  const isEdit = building !== null
  const { token } = useUser()
  const { venueData, restrictionCateData, addressData, featureData, isLoading } = useDashboard()

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [geojsonText, setGeojsonText] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Nội dung GeoJSON ban đầu khi mở chế độ sửa, dùng để biết người dùng có đổi hình học không
  const initialGeojsonRef = useRef('')

  // Nạp dữ liệu mỗi lần mở modal: giá trị hiện có khi sửa, hoặc form trống khi thêm mới
  useEffect(() => {
    if (!open) return
    setError('')
    setIsSubmitting(false)
    setFileName('')

    if (building) {
      const p = building.properties
      const initialText = JSON.stringify({
        type: 'Feature',
        properties: {},
        geometry: building.geometry,
      })
      initialGeojsonRef.current = initialText
      setGeojsonText(initialText)
      setValues({
        buildingName: p.buildingName ?? '',
        buildingCategoryId: p.buildingCategoryId ?? '',
        restrictionCategoryId: p.restrictionCategoryId ?? '',
        addressId: p.addressId ?? '',
        // Building trả về featureId dạng UUID, đổi lại sang id số để chọn trong select
        featureId: featureData?.find((f) => f.featureId === p.featureId)?.id ?? '',
      })
    } else {
      initialGeojsonRef.current = ''
      setGeojsonText('')
      setValues(INITIAL_VALUES)
    }
    // Chỉ nạp lại khi mở modal hoặc đổi building, tránh xóa dữ liệu đang nhập khi context tải lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, building])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, isSubmitting])

  const parsed = useMemo<ParseState>(() => {
    if (!geojsonText.trim()) return null
    try {
      return { ok: true, data: parseBuildingGeoJson(geojsonText) }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'GeoJSON không hợp lệ' }
    }
  }, [geojsonText])

  const features = useMemo(
    () =>
      [...(featureData ?? [])].sort(
        (a, b) => a.featureType.localeCompare(b.featureType) || a.id - b.id
      ),
    [featureData]
  )

  if (!open) return null

  const targetVenueId = building?.properties.venueId ?? venueId
  const venueName = venueData?.features.find((v) => v.id === targetVenueId)?.properties.venueName
  const suggestedName = parsed?.ok ? parsed.data.suggestedName : ''

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))
  const toNumberOrEmpty = (v: string) => (v === '' ? '' : Number(v))

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError('Tệp quá lớn (tối đa 5MB)')
      e.target.value = ''
      return
    }

    try {
      setGeojsonText(await file.text())
      setFileName(file.name)
      setError('')
    } catch {
      setError('Không đọc được tệp')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const buildingName = values.buildingName.trim() || suggestedName

    if (targetVenueId === null || targetVenueId === undefined) return setError('Chưa chọn địa điểm')
    if (!buildingName) return setError('Vui lòng nhập tên tòa nhà')
    if (values.buildingCategoryId === '') return setError('Vui lòng chọn loại tòa nhà')
    if (values.restrictionCategoryId === '') return setError('Vui lòng chọn quyền truy cập')
    if (values.addressId === '') return setError('Vui lòng chọn địa chỉ')
    if (!parsed) return setError('Vui lòng tải tệp hoặc dán nội dung GeoJSON')
    if (!parsed.ok) return setError(parsed.message)
    if (!token) return setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')

    // Khi sửa mà không đổi hình học thì giữ nguyên displayPoint đã lưu
    const geometryUnchanged = isEdit && geojsonText === initialGeojsonRef.current
    const displayPoint =
      geometryUnchanged && building?.properties.displayPoint
        ? building.properties.displayPoint
        : parsed.data.displayPoint

    const payload: BuildingRequest = {
      buildingName,
      displayPoint,
      geometry: parsed.data.geometry,
      ...(values.featureId !== '' && { featureId: values.featureId }),
      addressId: values.addressId,
      restrictionCategoryId: values.restrictionCategoryId,
      buildingCategoryId: values.buildingCategoryId,
      venueId: targetVenueId,
    }

    setError('')
    setIsSubmitting(true)

    try {
      if (building) {
        await updateBuilding(token, building.id, payload)
        message.success('Đã cập nhật tòa nhà')
      } else {
        await createBuilding(token, payload)
        message.success('Đã thêm tòa nhà')
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Lỗi lưu tòa nhà:', err)
      setError(err instanceof Error ? err.message : 'Không thể lưu tòa nhà')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="building-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="building-modal-title" className="text-base font-bold uppercase text-blue-700">
            {isEdit ? 'Chỉnh sửa tòa nhà' : 'Thêm tòa nhà mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className={labelClass}>Địa điểm</label>
            <input
              type="text"
              value={venueName ?? ''}
              readOnly
              className={`${inputClass} bg-gray-50 text-gray-500`}
            />
          </div>

          <div>
            <label htmlFor="buildingName" className={labelClass}>
              Tên tòa nhà <span className="text-red-500">*</span>
            </label>
            <input
              id="buildingName"
              type="text"
              value={values.buildingName}
              onChange={(e) => setField('buildingName', e.target.value)}
              placeholder={suggestedName || 'VD: Trường Nông nghiệp'}
              disabled={isSubmitting}
              className={inputClass}
            />
            {suggestedName && !values.buildingName.trim() && (
              <p className="mt-1 text-xs text-gray-400">
                Để trống sẽ dùng tên trong tệp: <strong>{suggestedName}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="buildingCategoryId" className={labelClass}>
                Loại tòa nhà <span className="text-red-500">*</span>
              </label>
              <select
                id="buildingCategoryId"
                value={values.buildingCategoryId}
                onChange={(e) => setField('buildingCategoryId', toNumberOrEmpty(e.target.value))}
                disabled={isSubmitting}
                className={inputClass}
              >
                <option value="">-- Chọn loại --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.buildingCategoryVietnameseName || c.buildingCategoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="restrictionCategoryId" className={labelClass}>
                Quyền truy cập <span className="text-red-500">*</span>
              </label>
              <select
                id="restrictionCategoryId"
                value={values.restrictionCategoryId}
                onChange={(e) => setField('restrictionCategoryId', toNumberOrEmpty(e.target.value))}
                disabled={isSubmitting}
                className={inputClass}
              >
                <option value="">-- Chọn quyền --</option>
                {restrictionCateData?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.restrictionCateName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="addressId" className={labelClass}>
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <select
              id="addressId"
              value={values.addressId}
              onChange={(e) => setField('addressId', toNumberOrEmpty(e.target.value))}
              disabled={isSubmitting}
              className={inputClass}
            >
              <option value="">-- Chọn địa chỉ --</option>
              {addressData?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.address || a.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="featureId" className={labelClass}>
              Loại feature <span className="font-normal text-gray-400">(không bắt buộc)</span>
            </label>
            <select
              id="featureId"
              value={values.featureId}
              onChange={(e) => setField('featureId', toNumberOrEmpty(e.target.value))}
              disabled={isSubmitting || features.length === 0}
              className={inputClass}
            >
              <option value="">
                {features.length === 0 && isLoading
                  ? 'Đang tải danh sách feature...'
                  : '-- Không chọn --'}
              </option>
              {features.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.featureType} ({f.featureId})
                </option>
              ))}
            </select>
          </div>

          {/* GeoJSON: tải tệp hoặc dán nội dung */}
          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <span className="text-sm font-bold text-gray-700">
              Hình học tòa nhà (GeoJSON) <span className="text-red-500">*</span>
            </span>
            {isEdit && (
              <p className="text-xs text-gray-500">
                Đang hiển thị hình học hiện tại. Tải tệp hoặc dán nội dung mới nếu muốn thay thế.
              </p>
            )}

            <div>
              <label
                htmlFor="geojsonFile"
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Tải tệp .geojson / .json
              </label>
              <input
                id="geojsonFile"
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                onChange={handleUploadFile}
                disabled={isSubmitting}
                className="block w-full cursor-pointer rounded-md border border-gray-300 bg-white text-xs text-slate-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
              {fileName && <p className="mt-1 text-xs text-gray-500">Đã chọn: {fileName}</p>}
            </div>

            <div>
              <label
                htmlFor="geojsonText"
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Hoặc dán nội dung GeoJSON
              </label>
              <textarea
                id="geojsonText"
                rows={5}
                value={geojsonText}
                onChange={(e) => {
                  setGeojsonText(e.target.value)
                  setFileName('')
                }}
                disabled={isSubmitting}
                placeholder='{"type": "FeatureCollection", "features": [...]}'
                className={`${inputClass} bg-white font-mono text-xs`}
              />
            </div>

            {parsed?.ok === false && (
              <p className="text-xs font-medium text-red-600">{parsed.message}</p>
            )}

            {parsed?.ok && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs text-slate-700">
                <p>
                  <strong className="text-emerald-700">GeoJSON hợp lệ:</strong> MultiPolygon gồm{' '}
                  {parsed.data.polygonCount} khối, {parsed.data.ringCount} vòng,{' '}
                  {parsed.data.vertexCount} đỉnh
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                  displayPoint: [{parsed.data.displayPoint.coordinates[0]},{' '}
                  {parsed.data.displayPoint.coordinates[1]}]
                </p>
                {parsed.data.featureCount > 1 && (
                  <p className="mt-0.5 text-amber-700">
                    Tệp có {parsed.data.featureCount} feature, chỉ dùng feature đầu tiên.
                  </p>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting
                ? isEdit
                  ? 'Đang lưu...'
                  : 'Đang thêm...'
                : isEdit
                  ? 'Lưu thay đổi'
                  : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
