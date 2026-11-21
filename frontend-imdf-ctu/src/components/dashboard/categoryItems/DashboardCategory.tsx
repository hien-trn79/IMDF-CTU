import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { message, Popconfirm } from 'antd'
import { Eye, Inbox, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useDashboard } from '../../../context/DashboardContext'
import { useUser } from '../../../context/UserContext'

import CategoryFormModal from './CategoryFormModal'
import CategoryDetailModal from './CategoryDetailModal'
import {
  CATEGORY_TABS,
  displayValue,
  resolveFields,
  type CategoryConfig,
  type CategoryRecord,
} from './CategoryConfig'
import { apiRequest } from '../venue/apiRequest'

const PAGE_SIZE = 10

const inputClass =
  'h-9 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100'
const thClass = 'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500'
const tdClass = 'px-4 py-3 text-sm text-slate-700'

export default function DashboardCategory() {
  const navigate = useNavigate()
  const { tab } = useParams()
  const dashboard = useDashboard()

  // Tab đang chọn lấy từ URL (/dashboard/category/:tab); sai hoặc thiếu thì dùng tab đầu tiên
  const active = CATEGORY_TABS.find((t) => t.id === tab) ?? CATEGORY_TABS[0]

  return (
    <div className="space-y-3 px-2">
      <header className="pt-2">
        <h1 className="text-base font-bold uppercase text-blue-700">Quản lý danh mục</h1>
        <p className="text-xs text-slate-500">Chọn một nhóm danh mục để xem và quản lý</p>
      </header>

      {/* TABS NGANG */}
      <div
        role="tablist"
        aria-label="Nhóm danh mục"
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {CATEGORY_TABS.map((t) => {
          const isActive = t.id === active.id
          const count = t.getData(dashboard)?.length
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => navigate(`/dashboard/category/${t.id}`)}
              className={`-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm transition ${
                isActive
                  ? 'border-blue-600 font-bold text-blue-700'
                  : 'border-transparent font-medium text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              {t.icon}
              {t.name}
              {count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* key theo tab để mỗi tab có trạng thái tìm kiếm / phân trang / modal riêng */}
      <CategoryPanel key={active.id} config={active} />
    </div>
  )
}

function CategoryPanel({ config }: { config: CategoryConfig }) {
  const { token } = useUser()
  const dashboard = useDashboard()
  const { isLoading, errors, refetch } = dashboard

  const data = config.getData(dashboard)
  const fields = useMemo(() => resolveFields(config, data), [config, data])
  const readOnly = config.readOnly === true

  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  // Modal thêm / sửa: editingRecord = null nghĩa là thêm mới
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CategoryRecord | null>(null)

  // Modal xem chi tiết
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<CategoryRecord | null>(null)

  const columnCount = fields.length + 2 // ID + các trường + thao tác

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const list = data ?? []
    if (!q) return list
    return list.filter((r) =>
      fields.some((f) =>
        String(r[f.key] ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
  }, [data, fields, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const recordLabel = (r: CategoryRecord) => displayValue(r[fields[0]?.key])

  const handleAdd = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const handleEdit = (r: CategoryRecord) => {
    setEditingRecord(r)
    setIsFormOpen(true)
  }

  const handleView = (r: CategoryRecord) => {
    setSelectedRecord(r)
    setDetailOpen(true)
  }

  // Trả về Promise để nút "Xóa" của Popconfirm hiện trạng thái đang tải cho tới khi xong
  const handleDelete = async (r: CategoryRecord) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      return
    }
    try {
      await apiRequest(`${config.endpoint}/${r.id}`, 'DELETE', token)
      message.success(`Đã xóa ${config.noun} "${recordLabel(r)}"`)
      refetch()
    } catch (err) {
      console.error(`Lỗi xóa ${config.noun}:`, err)
      message.error(err instanceof Error ? err.message : `Không thể xóa ${config.noun}`)
    }
  }

  const renderBody = () => {
    if (!data) {
      if (isLoading) return <MessageRow colSpan={columnCount} text="Đang tải dữ liệu..." />
      return (
        <tr>
          <td colSpan={columnCount} className="py-12 text-center text-sm text-red-500">
            {errors.length > 0 ? 'Không tải được dữ liệu.' : 'Chưa có dữ liệu.'}{' '}
            <button
              type="button"
              onClick={refetch}
              className="cursor-pointer font-semibold underline"
            >
              Thử lại
            </button>
          </td>
        </tr>
      )
    }
    if (pageItems.length === 0) {
      return (
        <tr>
          <td colSpan={columnCount} className="py-12 text-center">
            <Inbox size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">Không có dữ liệu phù hợp</p>
          </td>
        </tr>
      )
    }

    return pageItems.map((r) => (
      <tr key={r.id} className="transition hover:bg-sky-50/60">
        <td className={`${tdClass} text-slate-400`}>{r.id}</td>
        {fields.map((f, index) => (
          <td
            key={f.key}
            className={`${tdClass} max-w-[280px] truncate ${
              index === 0 ? 'font-semibold text-slate-800' : ''
            }`}
            title={displayValue(r[f.key])}
          >
            {displayValue(r[f.key]) === '—' ? (
              <span className="text-slate-300">—</span>
            ) : (
              displayValue(r[f.key])
            )}
          </td>
        ))}
        <td className={tdClass}>
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Xem chi tiết"
              onClick={() => handleView(r)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
            >
              <Eye size={16} />
            </button>
            {!readOnly && (
              <>
                <button
                  type="button"
                  title="Sửa"
                  onClick={() => handleEdit(r)}
                  className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil size={16} />
                </button>
                <Popconfirm
                  title={`Xóa ${config.noun}`}
                  description={`Bạn có chắc muốn xóa "${recordLabel(r)}"? Dữ liệu đang dùng danh mục này có thể bị ảnh hưởng và không thể hoàn tác.`}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  placement="left"
                  onConfirm={() => handleDelete(r)}
                >
                  <button
                    type="button"
                    title="Xóa"
                    className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </Popconfirm>
              </>
            )}
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <div role="tabpanel" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="my-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-blue-700">
            {config.icon}
            {config.title}
          </h2>
          <p className="text-xs text-slate-500">{config.description}</p>
        </div>
        {/* Thao tác riêng của bảng đang chọn */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} />
            Thêm {config.noun}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
              placeholder="Tìm kiếm..."
              className={`${inputClass} w-full pl-9 pr-3`}
            />
          </div>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} mục</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thClass}>ID</th>
                {fields.map((f) => (
                  <th key={f.key} className={thClass}>
                    {f.label}
                  </th>
                ))}
                <th className={`${thClass} text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">{renderBody()}</tbody>
          </table>
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            <span>
              Trang {safePage} / {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="cursor-pointer rounded-md border border-slate-200 px-3 py-1 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="cursor-pointer rounded-md border border-slate-200 px-3 py-1 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <CategoryFormModal
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          config={config}
          fields={fields}
          record={editingRecord}
        />
      )}

      <CategoryDetailModal
        open={detailOpen}
        config={config}
        fields={fields}
        record={selectedRecord}
        onClose={() => setDetailOpen(false)}
        afterClose={() => setSelectedRecord(null)}
      />
    </div>
  )
}

function MessageRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-sm text-slate-400">
        {text}
      </td>
    </tr>
  )
}
