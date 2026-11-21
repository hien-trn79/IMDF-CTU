import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { message, Popconfirm } from 'antd'
import { Building2, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useDashboard } from '../../../context/DashboardContext'
import { useUser } from '../../../context/UserContext'
import type { BuildingGeojsonItem } from '../../../model/Building.model'
import { useBuildingCategories, useBuildings } from './useBuildings'
import { deleteBuilding } from './buildingApi'
import BuildingFormModal from './BuildingFormModal'
import DashboardBuildingDetail from './DashboardBuildingDetail'

const PAGE_SIZE = 10

const inputClass =
  'h-9 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100'
const thClass = 'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500'
const tdClass = 'px-4 py-3 text-sm text-slate-700'

export default function DashboardBuilding() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { token } = useUser()
  const { venueData } = useDashboard()
  const categories = useBuildingCategories()

  const venues = venueData?.features ?? []

  // venueId lấy từ URL (?venueId=2). Nếu URL chưa có thì mặc định chọn venue đầu tiên.
  const venueParam = Number(searchParams.get('venueId'))
  const venueId: number | null =
    Number.isInteger(venueParam) && venueParam > 0 ? venueParam : (venues[0]?.id ?? null)

  const { buildings, isLoading, error, refetch } = useBuildings(venueId)

  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)

  // Modal thêm / sửa: editingBuilding = null nghĩa là thêm mới
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<BuildingGeojsonItem | null>(null)

  // Modal xem chi tiết
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingGeojsonItem | null>(null)

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return (buildings ?? []).filter((b) => {
      const matchName = !q || b.properties.buildingName?.toLowerCase().includes(q)
      const matchCate = !categoryId || b.properties.buildingCategoryId === Number(categoryId)
      return matchName && matchCate
    })
  }, [buildings, keyword, categoryId])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleChangeVenue = (value: string) => {
    setSearchParams(value ? { venueId: value } : {}, { replace: true })
    setKeyword('')
    setCategoryId('')
    setPage(1)
  }

  const handleView = (building: BuildingGeojsonItem) => {
    setSelectedBuilding(building)
    setDetailOpen(true)
  }

  const handleAdd = () => {
    setEditingBuilding(null)
    setIsFormOpen(true)
  }

  const handleEdit = (building: BuildingGeojsonItem) => {
    setEditingBuilding(building)
    setIsFormOpen(true)
  }

  // Trả về Promise để nút "Xóa" của Popconfirm hiện trạng thái đang tải cho tới khi xong
  const handleDelete = async (building: BuildingGeojsonItem) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      return
    }
    try {
      await deleteBuilding(token, building.id)
      message.success(`Đã xóa tòa nhà "${building.properties.buildingName}"`)
      refetch()
    } catch (err) {
      console.error('Lỗi xóa tòa nhà:', err)
      message.error(err instanceof Error ? err.message : 'Không thể xóa tòa nhà')
    }
  }

  const renderBody = () => {
    if (venueData === null) return <MessageRow text="Đang tải danh sách địa điểm..." />
    if (venueId === null) return <MessageRow text="Chưa có địa điểm nào. Hãy tạo Venue trước." />
    if (isLoading) return <MessageRow text="Đang tải dữ liệu..." />
    if (error) {
      return (
        <tr>
          <td colSpan={6} className="py-12 text-center text-sm text-red-500">
            Không tải được dữ liệu ({error}).{' '}
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
          <td colSpan={6} className="py-12 text-center">
            <Building2 size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">Không có tòa nhà phù hợp</p>
          </td>
        </tr>
      )
    }

    return pageItems.map((b) => (
      <tr key={b.id} className="transition hover:bg-sky-50/60">
        <td className={`${tdClass} text-slate-400`}>{b.id}</td>
        <td className={`${tdClass} font-semibold text-slate-800`}>
          {b.properties.buildingName || <span className="text-slate-300">—</span>}
        </td>
        <td className={tdClass}>
          {b.properties.buildingCategoryName ? (
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
              {b.properties.buildingCategoryName}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className={tdClass}>{b.properties.venueName}</td>
        <td
          className={`${tdClass} max-w-[160px] truncate font-mono text-xs text-slate-400`}
          title={b.properties.featureId}
        >
          {b.properties.featureId}
        </td>
        <td className={tdClass}>
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Xem chi tiết"
              onClick={() => handleView(b)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              title="Sửa"
              onClick={() => handleEdit(b)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil size={16} />
            </button>
            <Popconfirm
              title="Xóa tòa nhà"
              description={`Bạn có chắc muốn xóa "${b.properties.buildingName}"? Hành động này không thể hoàn tác.`}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              placement="left"
              onConfirm={() => handleDelete(b)}
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
          <h1 className="text-base font-bold uppercase text-blue-700">Tòa nhà - Building</h1>
          <p className="text-xs text-slate-500">
            Chọn địa điểm để xem danh sách tòa nhà thuộc địa điểm đó
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={venueId === null}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Thêm tòa nhà
        </button>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3">
          <div className="flex items-center gap-2">
            <label htmlFor="venueSelect" className="text-sm font-bold text-slate-700">
              Địa điểm <span className="text-red-500">*</span>
            </label>
            <select
              id="venueSelect"
              value={venueId ?? ''}
              onChange={(e) => handleChangeVenue(e.target.value)}
              className={`${inputClass} max-w-[240px] px-3`}
            >
              {venues.length === 0 && <option value="">-- Chưa có địa điểm --</option>}
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.properties.venueName}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
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
              placeholder="Tìm theo tên tòa nhà..."
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
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.buildingCategoryVietnameseName || c.buildingCategoryName}
              </option>
            ))}
          </select>

          <span className="ml-auto text-xs text-slate-500">{filtered.length} tòa nhà</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thClass}>ID</th>
                <th className={thClass}>Tên tòa nhà</th>
                <th className={thClass}>Loại tòa nhà</th>
                <th className={thClass}>Địa điểm</th>
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
      <BuildingFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        venueId={venueId}
        categories={categories}
        building={editingBuilding}
        onSuccess={refetch}
      />

      {/* Modal chi tiết tòa nhà */}
      <DashboardBuildingDetail
        open={detailOpen}
        building={selectedBuilding}
        onClose={() => setDetailOpen(false)}
        afterClose={() => setSelectedBuilding(null)}
      />
    </div>
  )
}

function MessageRow({ text }: { text: string }) {
  return (
    <tr>
      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
        {text}
      </td>
    </tr>
  )
}
