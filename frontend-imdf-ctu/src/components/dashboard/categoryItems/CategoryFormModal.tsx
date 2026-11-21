import { useEffect, useState } from 'react'
import { message } from 'antd'
import { Loader2, X } from 'lucide-react'
import { useDashboard } from '../../../context/DashboardContext'
import { useUser } from '../../../context/UserContext'
import { apiRequest } from '../venue/apiRequest'
import type { CategoryConfig, CategoryField, CategoryRecord } from './CategoryConfig'

interface Props {
  open: boolean
  onClose: () => void
  config: CategoryConfig
  fields: CategoryField[]
  /** Truyền bản ghi để mở ở chế độ chỉnh sửa; bỏ trống là thêm mới */
  record?: CategoryRecord | null
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'
const labelClass = 'mb-1 block text-sm font-bold text-gray-700'

export default function CategoryFormModal({ open, onClose, config, fields, record = null }: Props) {
  const isEdit = record !== null
  const { token } = useUser()
  const { refetch } = useDashboard()

  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Nạp giá trị mỗi lần mở modal: dữ liệu hiện có khi sửa, hoặc form trống khi thêm mới
  useEffect(() => {
    if (!open) return
    setError('')
    setIsSubmitting(false)
    setValues(
      Object.fromEntries(fields.map((f) => [f.key, record ? String(record[f.key] ?? '') : '']))
    )
    // Chỉ nạp lại khi mở modal hoặc đổi bản ghi, tránh xóa dữ liệu đang nhập khi context tải lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, isSubmitting])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    for (const f of fields) {
      if (f.required && !(values[f.key] ?? '').trim())
        return setError(`Vui lòng nhập ${f.label.toLowerCase()}`)
    }
    if (!token) return setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')

    const payload = Object.fromEntries(fields.map((f) => [f.key, (values[f.key] ?? '').trim()]))

    setError('')
    setIsSubmitting(true)

    try {
      if (record) {
        await apiRequest(`${config.endpoint}/${record.id}`, 'PUT', token, payload)
        message.success(`Đã cập nhật ${config.noun}`)
      } else {
        await apiRequest(config.endpoint, 'POST', token, payload)
        message.success(`Đã thêm ${config.noun}`)
      }
      refetch() // tải lại dữ liệu để bảng và các trang khác dùng danh mục này được cập nhật
      onClose()
    } catch (err) {
      console.error(`Lỗi lưu ${config.noun}:`, err)
      setError(err instanceof Error ? err.message : `Không thể lưu ${config.noun}`)
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
        aria-labelledby="category-modal-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="category-modal-title" className="text-base font-bold uppercase text-blue-700">
            {isEdit ? 'Chỉnh sửa' : 'Thêm'} {config.noun}
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
          {fields.map((f) => (
            <div key={f.key}>
              <label htmlFor={`field-${f.key}`} className={labelClass}>
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              <input
                id={`field-${f.key}`}
                type="text"
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>
          ))}

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
