import { useMemo, useState } from 'react'
import { message, Popconfirm } from 'antd'
import { Eye, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useDashboard } from '../../../context/DashboardContext'
import { useUser } from '../../../context/UserContext'
import type { VenueGeojsonItem } from '../../../model/imdf models/Venue.model'
import { deleteVenue } from './venueApi'
import VenueFormModal from './VenueFormModal'
import VenueDetailModal from './VenueDetailModal'

const PAGE_SIZE = 10
const COLUMN_COUNT = 7

const inputClass =
  'h-9 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100'
const thClass = 'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500'
const tdClass = 'px-4 py-3 text-sm text-slate-700'

export default function DashboardVenue() {
  const { token } = useUser()
  const { venueData, venueCateData, isLoading, errors, refetch } = useDashboard()

  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)

  // Modal thêm / sửa: editingVenue = null nghĩa là thêm mới
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<VenueGeojsonItem | null>(null)

  // Modal xem chi tiết
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<VenueGeojsonItem | null>(null)

  const filtered = useMemo(() => {
    const features = venueData?.features ?? []
    const q = keyword.trim().toLowerCase()
    return features.filter((v) => {
      const matchName = !q || v.properties.venueName?.toLowerCase().includes(q)
      const matchCate = !categoryId || v.properties.venueCategoryId === Number(categoryId)
      return matchName && matchCate
    })
  }, [venueData, keyword, categoryId])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleView = (venue: VenueGeojsonItem) => {
    setSelectedVenue(venue)
    setDetailOpen(true)
  }

  const handleAdd = () => {
    setEditingVenue(null)
    setIsFormOpen(true)
  }

  const handleEdit = (venue: VenueGeojsonItem) => {
    setEditingVenue(venue)
    setIsFormOpen(true)
  }

  // Trả về Promise để nút "Xóa" của Popconfirm hiện trạng thái đang tải cho tới khi xong
  const handleDelete = async (venue: VenueGeojsonItem) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      return
    }
    try {
      await deleteVenue(token, venue.id)
      message.success(`Đã xóa địa điểm "${venue.properties.venueName}"`)
      refetch()
    } catch (err) {
      console.error('Lỗi xóa địa điểm:', err)
      message.error(err instanceof Error ? err.message : 'Không thể xóa địa điểm')
    }
  }

  const renderBody = () => {
    if (!venueData) {
      if (isLoading) return <MessageRow text="Đang tải dữ liệu..." />
      return (
        <tr>
          <td colSpan={COLUMN_COUNT} className="py-12 text-center text-sm text-red-500">
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
          <td colSpan={COLUMN_COUNT} className="py-12 text-center">
            <MapPin size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">Không có địa điểm phù hợp</p>
          </td>
        </tr>
      )
    }

    return pageItems.map((venue) => (
      <tr key={venue.id} className="transition hover:bg-sky-50/60">
        <td className={`${tdClass} text-slate-400`}>{venue.id}</td>
        <td className={`${tdClass} font-semibold text-slate-800`}>
          {venue.properties.venueName || <span className="text-slate-300">—</span>}
        </td>
        <td className={tdClass}>
          {venue.properties.venueCategoryName ? (
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
              {venue.properties.venueCategoryName}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className={tdClass}>
          {venue.properties.restricttionCategoryName ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {venue.properties.restricttionCategoryName}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className={tdClass}>{venue.geometry.type}</td>
        <td
          className={`${tdClass} max-w-[160px] truncate font-mono text-xs text-slate-400`}
          title={venue.properties.featureId}
        >
          {venue.properties.featureId}
        </td>
        <td className={tdClass}>
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Xem chi tiết"
              onClick={() => handleView(venue)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              title="Sửa"
              onClick={() => handleEdit(venue)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil size={16} />
            </button>
            <Popconfirm
              title="Xóa địa điểm"
              description={`Bạn có chắc muốn xóa "${venue.properties.venueName}"? Dữ liệu liên quan có thể bị ảnh hưởng và không thể hoàn tác.`}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              placement="left"
              onConfirm={() => handleDelete(venue)}
            >
              <button
                type="button"
                title="Xóa"
                className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </Popconfirm>
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <div className="space-y-3 px-2">
      <header className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div>
          <h1 className="text-base font-bold uppercase text-blue-700">Địa điểm - Venue</h1>
          <p className="text-xs text-slate-500">Quản lý danh sách địa điểm trong hệ thống bản đồ</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm địa điểm
        </button>
      </header>

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
              placeholder="Tìm theo tên địa điểm..."
              className={`${inputClass} w-full pl-9 pr-3`}
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value)
              setPage(1)
            }}
            className={`${inputClass} px-3`}
          >
            <option value="">Tất cả loại</option>
            {venueCateData?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.venueCategoryVietnameseName || c.venueCategoryName}
              </option>
            ))}
          </select>

          <span className="ml-auto text-xs text-slate-500">{filtered.length} địa điểm</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thClass}>ID</th>
                <th className={thClass}>Tên địa điểm</th>
                <th className={thClass}>Loại địa điểm</th>
                <th className={thClass}>Quyền</th>
                <th className={thClass}>Geometry</th>
                <th className={thClass}>Feature UUID</th>
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

      {/* Modal thêm / sửa */}
      <VenueFormModal open={isFormOpen} onClose={() => setIsFormOpen(false)} venue={editingVenue} />

      {/* Modal chi tiết địa điểm */}
      <VenueDetailModal
        open={detailOpen}
        venue={selectedVenue}
        onClose={() => setDetailOpen(false)}
        afterClose={() => setSelectedVenue(null)}
      />
    </div>
  )
}

function MessageRow({ text }: { text: string }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} className="py-12 text-center text-sm text-slate-400">
        {text}
      </td>
    </tr>
  )
}
