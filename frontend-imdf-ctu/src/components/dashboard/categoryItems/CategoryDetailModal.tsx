import { useEffect } from 'react'
import { X } from 'lucide-react'
import {
  displayValue,
  type CategoryConfig,
  type CategoryField,
  type CategoryRecord,
} from './CategoryConfig'

interface Props {
  open: boolean
  config: CategoryConfig
  fields: CategoryField[]
  record: CategoryRecord | null
  onClose: () => void
  /** Gọi sau khi đóng modal (dùng để xóa bản ghi đang chọn ở component cha) */
  afterClose?: () => void
}

export default function CategoryDetailModal({
  open,
  config,
  fields,
  record,
  onClose,
  afterClose,
}: Props) {
  const handleClose = () => {
    onClose()
    afterClose?.()
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        afterClose?.()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, afterClose])

  if (!open || !record) return null

  const labels = new Map(fields.map((f) => [f.key, f.label]))

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-detail-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2
            id="category-detail-title"
            className="flex items-center gap-2 text-base font-bold uppercase text-blue-700"
          >
            {config.icon}
            Chi tiết {config.noun}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hiện mọi trường có trong bản ghi, kể cả trường chưa khai báo trong cấu hình */}
        <dl className="space-y-2 px-5 py-4">
          {Object.entries(record).map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
            >
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {key === 'id' ? 'ID' : (labels.get(key) ?? key)}
              </dt>
              <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">
                {displayValue(value)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-end border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
