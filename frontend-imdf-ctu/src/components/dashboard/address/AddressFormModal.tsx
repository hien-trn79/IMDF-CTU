import { useEffect, useMemo, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useDashboard } from '../../../context/DashboardContext'
import { useUser } from '../../../context/UserContext'
import type { AddressRequest } from '../../../model/imdf models/Address.model'
import { COUNTRIES, VN_PROVINCES, VN_POSTAL_REGEX } from './vnAddress'

const API_URL = 'http://localhost:8081/api'

// Kiểu một địa chỉ trong bảng (lấy thẳng từ DashboardContext)
export type AddressItem = NonNullable<ReturnType<typeof useDashboard>['addressData']>[number]

interface FormValues {
  address: string
  unit: string
  locality: string
  province: string
  country: string
  postalCode: string
  postalCodeExtension: string
  postalCodeVanity: string
  featureId: number | ''
}

const INITIAL_VALUES: FormValues = {
  address: '',
  unit: '',
  locality: '',
  province: '',
  country: 'VN', // mặc định Việt Nam (ISO 3166-1 alpha-2)
  postalCode: '',
  postalCodeExtension: '',
  postalCodeVanity: '',
  featureId: '',
}

// Dữ liệu cũ có thể lưu "Việt Nam" thay vì "VN" -> chuẩn hóa về mã ISO
function normalizeCountry(value?: string | null): string {
  const v = (value ?? '').trim()
  if (!v) return 'VN'
  const lower = v.toLowerCase()
  if (['vn', 'vnm', 'việt nam', 'viet nam', 'vietnam'].includes(lower)) return 'VN'
  return v
}

function toFormValues(a: AddressItem): FormValues {
  // Response có thể chưa trả featureId, nên đọc an toàn
  const rawFeatureId = (a as { featureId?: unknown }).featureId
  return {
    address: a.address ?? '',
    unit: a.unit ?? '',
    locality: a.locality ?? '',
    province: a.province ?? '',
    country: normalizeCountry(a.country),
    postalCode: a.postalCode ?? '',
    postalCodeExtension: a.postalCodeExtension ?? '',
    postalCodeVanity: a.postalCodeVanity ?? '',
    featureId: typeof rawFeatureId === 'number' ? rawFeatureId : '',
  }
}

interface Props {
  open: boolean
  onClose: () => void
  /** Có giá trị = chế độ sửa, null/undefined = chế độ thêm mới */
  address?: AddressItem | null
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'
const labelClass = 'mb-1 block text-sm font-bold text-gray-700'

type TextKey = Exclude<keyof FormValues, 'featureId'>

export default function AddressFormModal({ open, onClose, address }: Props) {
  const { token } = useUser()
  const { featureData, isLoading, refetch } = useDashboard()

  const isEdit = !!address

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sắp xếp theo loại feature để dễ tìm trong danh sách chọn
  const features = useMemo(
    () =>
      [...(featureData ?? [])].sort(
        (a, b) => a.featureType.localeCompare(b.featureType) || a.id - b.id
      ),
    [featureData]
  )

  // Nếu dữ liệu cũ có tỉnh không nằm trong danh sách chuẩn thì vẫn giữ lại làm một lựa chọn
  const provinceOptions = useMemo<string[]>(() => {
    const base: string[] = [...VN_PROVINCES]
    const current = address?.province?.trim()
    return current && !base.includes(current) ? [current, ...base] : base
  }, [address])

  const countryOptions = useMemo(() => {
    const base: { code: string; name: string }[] = COUNTRIES.map((c) => ({ ...c }))
    const current = address ? normalizeCountry(address.country) : ''
    return current && !base.some((c) => c.code === current)
      ? [{ code: current, name: current }, ...base]
      : base
  }, [address])

  useEffect(() => {
    if (open) {
      setValues(address ? toFormValues(address) : INITIAL_VALUES)
      setError('')
      setIsSubmitting(false)
    }
  }, [open, address])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, isSubmitting])

  if (!open) return null

  const setText = (key: TextKey, value: string) => setValues((prev) => ({ ...prev, [key]: value }))

  const renderText = (
    key: TextKey,
    label: string,
    placeholder: string,
    required = false,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <label htmlFor={key} className={labelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={key}
        type="text"
        value={values[key]}
        onChange={(e) => setText(key, e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        className={inputClass}
        {...extra}
      />
    </div>
  )

  // Ô mã chỉ cho nhập số
  const onlyDigits = (key: TextKey, max: number) => ({
    inputMode: 'numeric' as const,
    maxLength: max,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setText(key, e.target.value.replace(/\D/g, '').slice(0, max)),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!values.address.trim()) return setError('Vui lòng nhập địa chỉ')
    if (!values.locality.trim()) return setError('Vui lòng nhập xã/phường')
    if (!values.province) return setError('Vui lòng chọn tỉnh/thành phố')
    if (!values.country) return setError('Vui lòng chọn quốc gia')
    if (values.postalCode && !VN_POSTAL_REGEX.test(values.postalCode))
      return setError('Mã bưu chính phải gồm 5 hoặc 6 chữ số')
    // Khi sửa, response có thể không trả featureId nên cho phép bỏ trống (giữ nguyên feature cũ)
    if (!isEdit && values.featureId === '') return setError('Vui lòng chọn loại feature')
    if (!token) return setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')

    const payload = {
      address: values.address.trim(),
      unit: values.unit.trim(),
      locality: values.locality.trim(),
      province: values.province,
      country: values.country,
      postalCode: values.postalCode,
      postalCodeExtension: values.postalCodeExtension.trim(),
      postalCodeVanity: values.postalCodeVanity.trim(),
      ...(values.featureId !== '' && { featureId: values.featureId }),
    } as AddressRequest

    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(
        isEdit ? `${API_URL}/addresses/${address.id}` : `${API_URL}/addresses`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        // Cố đọc thông báo lỗi từ backend nếu có
        let detail = ''
        try {
          const body = await response.text()
          try {
            const json = JSON.parse(body) as { message?: string; error?: string }
            detail = json.message ?? json.error ?? ''
          } catch {
            detail = body
          }
        } catch {
          // bỏ qua
        }
        throw new Error(detail.slice(0, 200) || `Lỗi ${response.status}`)
      }

      refetch() // tải lại danh sách để bảng hiện dữ liệu mới
      onClose()
    } catch (err) {
      console.error(isEdit ? 'Lỗi cập nhật địa chỉ:' : 'Lỗi thêm địa chỉ:', err)
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? 'Không thể cập nhật địa chỉ'
            : 'Không thể thêm địa chỉ'
      )
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
        aria-labelledby="address-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="address-modal-title" className="text-base font-bold uppercase text-blue-700">
            {isEdit ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
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
          {renderText('address', 'Địa chỉ', 'VD: Khu II, đường 3/2', true)}
          {renderText('unit', 'Đơn vị (unit)', 'VD: Tòa A, Phòng 101')}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {renderText('locality', 'Xã/Phường', 'VD: Xuân Khánh', true)}

            <div>
              <label htmlFor="province" className={labelClass}>
                Tỉnh/Thành phố <span className="text-red-500">*</span>
              </label>
              <select
                id="province"
                value={values.province}
                onChange={(e) => setText('province', e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              >
                <option value="">-- Chọn tỉnh/thành phố --</option>
                {provinceOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="country" className={labelClass}>
              Quốc gia <span className="text-red-500">*</span>
            </label>
            <select
              id="country"
              value={values.country}
              onChange={(e) => setText('country', e.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            >
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name === c.code ? c.code : `${c.name} (${c.code})`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {renderText(
              'postalCode',
              'Mã bưu chính',
              'VD: 94000',
              false,
              onlyDigits('postalCode', 6)
            )}
            {renderText(
              'postalCodeExtension',
              'Mã mở rộng',
              'VD: 94119',
              false,
              onlyDigits('postalCodeExtension', 6)
            )}
            {renderText('postalCodeVanity', 'Mã tùy chỉnh', 'VD: 94000')}
          </div>

          <div>
            <label htmlFor="featureId" className={labelClass}>
              Loại feature {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <select
              id="featureId"
              value={values.featureId}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  featureId: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              disabled={isSubmitting || features.length === 0}
              className={inputClass}
            >
              <option value="">
                {features.length === 0
                  ? isLoading
                    ? 'Đang tải danh sách feature...'
                    : 'Không có feature nào'
                  : isEdit
                    ? '-- Giữ nguyên feature hiện tại --'
                    : '-- Chọn loại feature --'}
              </option>
              {features.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.featureType} ({f.featureId})
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
