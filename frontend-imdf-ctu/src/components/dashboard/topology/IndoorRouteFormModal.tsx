import { useEffect, useState } from 'react'
import { message } from 'antd'
import { Loader2, X } from 'lucide-react'
import { useUser } from '../../../context/UserContext'
import type { TopologyRequest, TopologyResponse } from '../../../model/route models/Topology.model'
import { apiRequest } from '../venue/apiRequest'

const DEFAULT_STATUS = 'ACTIVE'

interface FormValues {
  indoorRouteName: string
  indoorRouteType: string
  status: string
}

const INITIAL_VALUES: FormValues = {
  indoorRouteName: '',
  indoorRouteType: '',
  status: DEFAULT_STATUS,
}

interface Props {
  open: boolean
  onClose: () => void
  /** Truyền đường đi để mở ở chế độ chỉnh sửa; bỏ trống là thêm mới */
  route?: TopologyResponse | null
  /** Tầng đang chọn (dùng khi thêm mới) */
  levelId: number
  /** Mô tả vị trí đang thao tác, ví dụ "Khu II › Khoa CNTT › Tầng 1" */
  placeText: string
  /** Gọi sau khi lưu thành công để tải lại danh sách của tầng */
  onSaved: () => void
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'
const labelClass = 'mb-1 block text-sm font-bold text-gray-700'

export default function IndoorRouteFormModal({
  open,
  onClose,
  route = null,
  levelId,
  placeText,
  onSaved,
}: Props) {
  const isEdit = route !== null
  const { token } = useUser()

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Nạp dữ liệu mỗi lần mở modal
  useEffect(() => {
    if (!open) return
    setError('')
    setIsSubmitting(false)
    setValues(
      route
        ? {
            indoorRouteName: route.indoorRouteName ?? '',
            indoorRouteType: route.indoorRouteType ?? '',
            status: route.status || DEFAULT_STATUS,
          }
        : INITIAL_VALUES
    )
  }, [open, route])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, isSubmitting])

  if (!open) return null

  const setField = (key: keyof FormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!values.indoorRouteName.trim()) return setError('Vui lòng nhập tên đường đi')
    if (!values.status.trim()) return setError('Vui lòng nhập trạng thái')
    if (!token) return setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')

    const payload: TopologyRequest = {
      indoorRouteName: values.indoorRouteName.trim(),
      indoorRouteType: values.indoorRouteType.trim(),
      status: values.status.trim(),
      levelId: route?.levelId ?? levelId,
    }

    setError('')
    setIsSubmitting(true)

    try {
      if (route) {
        await apiRequest(`/indoor-routes/${route.id}`, 'PUT', token, payload)
        message.success('Đã cập nhật đường đi')
      } else {
        await apiRequest('/indoor-routes', 'POST', token, payload)
        message.success('Đã thêm đường đi')
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('Lỗi lưu đường đi:', err)
      setError(err instanceof Error ? err.message : 'Không thể lưu đường đi')
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
        aria-labelledby="route-modal-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="route-modal-title" className="text-base font-bold uppercase text-blue-700">
            {isEdit ? 'Chỉnh sửa đường đi' : 'Thêm đường đi mới'}
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
            <label className={labelClass}>Vị trí</label>
            <input
              type="text"
              value={placeText}
              readOnly
              className={`${inputClass} bg-gray-50 text-gray-500`}
            />
          </div>

          <div>
            <label htmlFor="indoorRouteName" className={labelClass}>
              Tên đường đi <span className="text-red-500">*</span>
            </label>
            <input
              id="indoorRouteName"
              type="text"
              value={values.indoorRouteName}
              onChange={(e) => setField('indoorRouteName', e.target.value)}
              placeholder="VD: Lối đi chính tầng 1"
              disabled={isSubmitting}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="indoorRouteType" className={labelClass}>
                Loại đường đi
              </label>
              <input
                id="indoorRouteType"
                type="text"
                value={values.indoorRouteType}
                onChange={(e) => setField('indoorRouteType', e.target.value)}
                placeholder="VD: walkway"
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="status" className={labelClass}>
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <input
                id="status"
                type="text"
                value={values.status}
                onChange={(e) => setField('status', e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">Mặc định {DEFAULT_STATUS}</p>
            </div>
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
