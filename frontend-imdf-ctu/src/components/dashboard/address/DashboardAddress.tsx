import { useMemo, useState } from 'react'
import { message, Popconfirm } from 'antd'
import { Eye, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useDashboard } from '../../../context/DashboardContext'
import { useUser } from '../../../context/UserContext'
import AddressFormModal, { type AddressItem } from './AddressFormModal'
import DashboardAddressDetail from './DashboardAddressDetail'
import { apiRequest } from '../venue/apiRequest'

const PAGE_SIZE = 10
const COLUMN_COUNT = 10

const inputClass =
  'h-9 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100'
// whitespace-nowrap: tiêu đề và ô dữ liệu không bị xuống dòng
const thClass =
  'whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500'
const tdClass = 'whitespace-nowrap px-4 py-3 text-sm text-slate-700'

function Badge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-slate-300">—</span>
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
      {value}
    </span>
  )
}

export default function DashboardAddress() {
  const { token } = useUser()
  const { addressData, isLoading, errors, refetch } = useDashboard()

  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  // Modal thêm/sửa: editing = null là thêm mới, có giá trị là sửa
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<AddressItem | null>(null)

  const [isOpenModalDetail, setIsOpenModalDetail] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null)

  const openAdd = () => {
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (a: AddressItem) => {
    setEditing(a)
    setIsFormOpen(true)
  }

  const handleViewDetail = (a: AddressItem) => {
    setIsOpenModalDetail(true)
    setSelectedAddress(a)
  }

  // Trả về Promise để nút "Xóa" trong Popconfirm hiện trạng thái đang tải cho tới khi xong
  const handleDelete = async (a: AddressItem) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      return
    }
    try {
      await apiRequest(`/addresses/${a.id}`, 'DELETE', token)
      message.success('Đã xóa địa chỉ')
      refetch() // tải lại danh sách để bảng bỏ địa chỉ đã xóa
    } catch (err) {
      console.error('Lỗi xóa địa chỉ:', err)
      message.error(err instanceof Error ? err.message : 'Không thể xóa địa chỉ')
    }
  }

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const list = addressData ?? []
    if (!q) return list
    return list.filter((a) =>
      [a.address, a.unit, a.locality, a.province, a.country, a.postalCode, a.addressId].some(
        (field) => field?.toLowerCase().includes(q)
      )
    )
  }, [addressData, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const renderBody = () => {
    if (isLoading && !addressData) {
      return <MessageRow text="Đang tải dữ liệu..." />
    }
    if (!addressData) {
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
            <p className="text-sm text-slate-500">Không có địa chỉ phù hợp</p>
          </td>
        </tr>
      )
    }

    return pageItems.map((a) => (
      <tr key={a.id} className="transition hover:bg-sky-50/60">
        <td className={`${tdClass} text-slate-400`}>{a.id}</td>
        <td
          className={`${tdClass} max-w-40 truncate font-mono text-xs text-slate-400`}
          title={a.addressId}
        >
          {a.addressId}
        </td>
        <td className={`${tdClass} font-semibold text-slate-800`}>
          {a.address || <span className="text-slate-300">—</span>}
        </td>
        <td className={tdClass}>
          <Badge value={a.locality} />
        </td>
        <td className={tdClass}>
          <Badge value={a.province} />
        </td>
        <td className={tdClass}>
          <Badge value={a.country} />
        </td>
        <td className={tdClass}>
          <Badge value={a.postalCode} />
        </td>
        <td className={tdClass}>
          <Badge value={a.postalCodeExtension} />
        </td>
        <td className={tdClass}>
          <Badge value={a.postalCodeVanity} />
        </td>
        <td className={tdClass}>
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Xem chi tiết"
              onClick={() => handleViewDetail(a)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              title="Sửa"
              onClick={() => openEdit(a)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil size={16} />
            </button>

            {/* Xác nhận xóa nhỏ gọn, bung ngay cạnh icon */}
            <Popconfirm
              title="Xóa địa chỉ này?"
              icon={<Trash2 size={15} className="mt-0.5 mr-2 text-red-500" />}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, size: 'small' }}
              cancelButtonProps={{ size: 'small' }}
              placement="left"
              onConfirm={() => handleDelete(a)}
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
          <h1 className="text-base font-bold uppercase text-blue-700">Địa chỉ - Address</h1>
          <p className="text-xs text-slate-500">Quản lý danh sách địa chỉ trong hệ thống bản đồ</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm địa chỉ
        </button>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
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
              placeholder="Tìm theo địa chỉ, xã/phường, tỉnh, mã..."
              className={`${inputClass} w-full pl-9 pr-3`}
            />
          </div>

          <span className="ml-auto whitespace-nowrap text-xs text-slate-500">
            {filtered.length} địa chỉ
          </span>
        </div>

        {/* Bảng rộng hơn khung thì cuộn ngang thay vì ép chữ xuống dòng */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-slate-50">
              <tr>
                <th className={thClass}>ID</th>
                <th className={thClass}>UUID địa chỉ</th>
                <th className={thClass}>Địa chỉ</th>
                <th className={thClass}>Xã/Phường</th>
                <th className={thClass}>Tỉnh/Thành phố</th>
                <th className={thClass}>Quốc gia</th>
                <th className={thClass}>Mã bưu chính</th>
                <th className={thClass}>Mã mở rộng</th>
                <th className={thClass}>Mã tùy chỉnh</th>
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

      <AddressFormModal open={isFormOpen} address={editing} onClose={() => setIsFormOpen(false)} />

      {isOpenModalDetail && selectedAddress && (
        <DashboardAddressDetail
          open={isOpenModalDetail}
          address={selectedAddress}
          onClose={() => setIsOpenModalDetail(false)}
          afterClose={() => setSelectedAddress(null)}
        />
      )}
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
