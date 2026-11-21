import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { message, Popconfirm } from 'antd'
import {
  Eye,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Route as RouteIcon,
  Search,
  Trash2,
} from 'lucide-react'
import { useDashboard } from '../../../context/DashboardContext'
import { useUser } from '../../../context/UserContext'
import type { BuildingGeojsonItem } from '../../../model/Building.model'
import { asArray, levelLabel, normalizeLevels, useApiList } from './useApiList'
import IndoorRouteFormModal from './IndoorRouteFormModal'
import IndoorRouteDetailModal from './IndoorRouteDetailModal'
import type { TopologyResponse } from '../../../model/route models/Topology.model'
import { apiRequest } from '../venue/apiRequest'

const PAGE_SIZE = 10
const COLUMN_COUNT = 7

const inputClass =
  'h-9 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60'
const thClass =
  'whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500'
const tdClass = 'whitespace-nowrap px-4 py-3 text-sm text-slate-700'

// Hàm chuẩn hóa đặt ở ngoài component để tham chiếu luôn ổn định
const normalizeBuildings = (raw: unknown) => asArray(raw) as BuildingGeojsonItem[]
const normalizeRoutes = (raw: unknown) => asArray(raw) as TopologyResponse[]

const parseId = (v: string | null): number | null => {
  const n = Number(v)
  return v !== null && Number.isInteger(n) && n > 0 ? n : null
}

const buildingLabel = (b: BuildingGeojsonItem) =>
  b.properties.buildingName?.trim() || `Tòa nhà #${b.id}`

/* ============================== TRANG CHÍNH ============================== */

export default function DashboardTopology() {
  const [params, setParams] = useSearchParams()
  const { venueData } = useDashboard()
  const venues = venueData?.features ?? []

  // Địa điểm: lấy từ URL, không hợp lệ hoặc chưa có thì mặc định địa điểm đầu tiên
  const venueParam = parseId(params.get('venueId'))
  const venueId =
    venueParam !== null && (venues.length === 0 || venues.some((v) => v.id === venueParam))
      ? venueParam
      : (venues[0]?.id ?? null)

  // Tòa nhà: chỉ tải các tòa nhà của địa điểm đang chọn
  const buildingsQ = useApiList(
    venueId !== null ? `/buildings?venueId=${venueId}` : null,
    normalizeBuildings
  )
  const buildings = buildingsQ.items
  const buildingParam = parseId(params.get('buildingId'))
  const buildingId =
    venueId !== null &&
    buildingParam !== null &&
    (buildings === null || buildings.some((b) => b.id === buildingParam))
      ? buildingParam
      : null

  // Tầng: chỉ tải các tầng của tòa nhà đang chọn
  const levelsQ = useApiList(
    buildingId !== null ? `/levels?buildingId=${buildingId}` : null,
    normalizeLevels
  )
  const levels = levelsQ.items
  const levelParam = parseId(params.get('levelId'))
  const levelId =
    buildingId !== null &&
    levelParam !== null &&
    (levels === null || levels.some((l) => l.id === levelParam))
      ? levelParam
      : null

  // Đổi lựa chọn ở cấp nào thì các cấp dưới tự đặt lại
  const go = (next: {
    venueId?: number | null
    buildingId?: number | null
    levelId?: number | null
  }) => {
    const p = new URLSearchParams()
    if (next.venueId) p.set('venueId', String(next.venueId))
    if (next.buildingId) p.set('buildingId', String(next.buildingId))
    if (next.levelId) p.set('levelId', String(next.levelId))
    setParams(p, { replace: true })
  }

  const venue = venues.find((v) => v.id === venueId)
  const building = buildings?.find((b) => b.id === buildingId)
  const level = levels?.find((l) => l.id === levelId)

  const venueOptions = venues.map((v) => ({ value: v.id, label: v.properties.venueName }))
  const buildingOptions = (buildings ?? []).map((b) => ({ value: b.id, label: buildingLabel(b) }))
  const levelOptions = (levels ?? []).map((l) => ({ value: l.id, label: levelLabel(l) }))

  const renderEmptyHint = () => {
    let text = 'Chọn địa điểm, tòa nhà và tầng để xem đường đi.'
    if (venueId === null)
      text = venueData === null ? 'Đang tải danh sách địa điểm...' : 'Chưa có địa điểm nào.'
    else if (buildingId === null)
      text =
        buildings !== null && buildings.length === 0
          ? 'Địa điểm này chưa có tòa nhà nào.'
          : 'Chọn một tòa nhà để tiếp tục.'
    else if (levelId === null)
      text =
        levels !== null && levels.length === 0
          ? 'Tòa nhà này chưa có tầng nào.'
          : 'Chọn một tầng để xem đường đi.'

    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center">
        <Layers size={30} className="mx-auto mb-2 text-slate-300" />
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-2">
      <header className="pt-2">
        <h1 className="text-base font-bold uppercase text-blue-700">
          Đường đi trong nhà - Topology
        </h1>
        <p className="text-xs text-slate-500">
          Chọn lần lượt địa điểm, tòa nhà và tầng để quản lý đường đi của tầng đó
        </p>
      </header>

      {/* BỘ CHỌN 3 CẤP */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-3">
        <StepSelect
          step={1}
          label="Địa điểm"
          value={venueId}
          options={venueOptions}
          placeholder="-- Chọn địa điểm --"
          loading={venueData === null}
          countText={`${venues.length} địa điểm`}
          onChange={(v) => go({ venueId: v })}
        />
        <StepSelect
          step={2}
          label="Tòa nhà"
          value={buildingId}
          options={buildingOptions}
          placeholder="-- Chọn tòa nhà --"
          disabled={venueId === null}
          loading={buildingsQ.isLoading}
          error={buildingsQ.error}
          onRetry={buildingsQ.refetch}
          countText={buildings ? `${buildings.length} tòa nhà` : undefined}
          onChange={(b) => go({ venueId, buildingId: b })}
        />
        <StepSelect
          step={3}
          label="Tầng"
          value={levelId}
          options={levelOptions}
          placeholder="-- Chọn tầng --"
          disabled={buildingId === null}
          loading={levelsQ.isLoading}
          error={levelsQ.error}
          onRetry={levelsQ.refetch}
          countText={levels ? `${levels.length} tầng` : undefined}
          onChange={(l) => go({ venueId, buildingId, levelId: l })}
        />
      </div>

      {levelId !== null ? (
        // key theo tầng để mỗi tầng có trạng thái tìm kiếm, phân trang, modal riêng
        <RoutesPanel
          key={levelId}
          levelId={levelId}
          venueName={venue?.properties.venueName ?? ''}
          buildingName={building ? buildingLabel(building) : ''}
          levelName={level ? levelLabel(level) : ''}
        />
      ) : (
        renderEmptyHint()
      )}
    </div>
  )
}

/* ============================== Ô CHỌN TỪNG CẤP ============================== */

interface StepSelectProps {
  step: number
  label: string
  value: number | null
  options: { value: number; label: string }[]
  placeholder: string
  disabled?: boolean
  loading?: boolean
  error?: string
  countText?: string
  onRetry?: () => void
  onChange: (value: number | null) => void
}

function StepSelect({
  step,
  label,
  value,
  options,
  placeholder,
  disabled,
  loading,
  error,
  countText,
  onRetry,
  onChange,
}: StepSelectProps) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-700">
        <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[11px] text-blue-700">
          {step}
        </span>
        {label}
      </label>
      <select
        value={value ?? ''}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className={`${inputClass} w-full px-3`}
      >
        <option value="">{loading ? 'Đang tải...' : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <p className="mt-1 h-4 text-[11px] text-slate-400">
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" /> Đang tải...
          </span>
        ) : error ? (
          <span className="text-red-500">
            {error}.{' '}
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer font-semibold underline"
            >
              Thử lại
            </button>
          </span>
        ) : (
          countText
        )}
      </p>
    </div>
  )
}

/* ============================== BẢNG ĐƯỜNG ĐI CỦA 1 TẦNG ============================== */

interface PanelProps {
  levelId: number
  venueName: string
  buildingName: string
  levelName: string
}

function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-slate-300">—</span>
  const active = value.toUpperCase() === 'ACTIVE'
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {value}
    </span>
  )
}

function RoutesPanel({ levelId, venueName, buildingName, levelName }: PanelProps) {
  const { token } = useUser()
  const { items, isLoading, isValidating, error, refetch, mutate } = useApiList(
    `/indoor-routes?levelId=${levelId}`,
    normalizeRoutes
  )

  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<TopologyResponse | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<TopologyResponse | null>(null)

  const placeText = [venueName, buildingName, levelName].filter(Boolean).join(' › ')

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const list = items ?? []
    if (!q) return list
    return list.filter((r) =>
      [r.indoorRouteName, r.indoorRouteType, r.status, r.indoorRouteId].some((field) =>
        field?.toLowerCase().includes(q)
      )
    )
  }, [items, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const openAdd = () => {
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (r: TopologyResponse) => {
    setEditing(r)
    setIsFormOpen(true)
  }

  const openDetail = (r: TopologyResponse) => {
    setSelected(r)
    setDetailOpen(true)
  }

  // Bỏ dòng khỏi bảng ngay lập tức, sau đó đồng bộ lại với máy chủ (khôi phục nếu xóa thất bại)
  const handleDelete = async (r: TopologyResponse) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      return
    }
    mutate((current) => current.filter((x) => x.id !== r.id))
    try {
      await apiRequest(`/indoor-routes/${r.id}`, 'DELETE', token)
      message.success('Đã xóa đường đi')
    } catch (err) {
      console.error('Lỗi xóa đường đi:', err)
      message.error(err instanceof Error ? err.message : 'Không thể xóa đường đi')
    } finally {
      refetch()
    }
  }

  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }, (_, i) => (
        <tr key={i}>
          <td colSpan={COLUMN_COUNT} className="px-4 py-3">
            <div className="h-4 animate-pulse rounded bg-slate-100" />
          </td>
        </tr>
      ))
    }
    if (!items) {
      return (
        <tr>
          <td colSpan={COLUMN_COUNT} className="py-12 text-center text-sm text-red-500">
            {error ? `Không tải được dữ liệu (${error}).` : 'Chưa có dữ liệu.'}{' '}
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
            <RouteIcon size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">
              {keyword.trim() ? 'Không có đường đi phù hợp' : 'Tầng này chưa có đường đi nào'}
            </p>
          </td>
        </tr>
      )
    }

    return pageItems.map((r) => (
      <tr key={r.id} className="transition hover:bg-sky-50/60">
        <td className={`${tdClass} text-slate-400`}>{r.id}</td>
        <td className={`${tdClass} font-semibold text-slate-800`}>
          {r.indoorRouteName || <span className="text-slate-300">—</span>}
        </td>
        <td className={tdClass}>
          {r.indoorRouteType ? (
            <span className="inline-block whitespace-nowrap rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
              {r.indoorRouteType}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className={tdClass}>
          <StatusBadge value={r.status} />
        </td>
        <td className={tdClass}>{r.ordinal ?? <span className="text-slate-300">—</span>}</td>
        <td
          className={`${tdClass} max-w-[160px] truncate font-mono text-xs text-slate-400`}
          title={r.indoorRouteId}
        >
          {r.indoorRouteId}
        </td>
        <td className={tdClass}>
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Xem chi tiết"
              onClick={() => openDetail(r)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              title="Sửa"
              onClick={() => openEdit(r)}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil size={16} />
            </button>
            <Popconfirm
              title="Xóa đường đi này?"
              icon={<Trash2 size={15} className="mt-0.5 text-red-500" />}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, size: 'small' }}
              cancelButtonProps={{ size: 'small' }}
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
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-blue-700">
            <RouteIcon size={16} />
            Đường đi của tầng
          </h2>
          <p className="truncate text-xs text-slate-500">{placeText}</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm đường đi
        </button>
      </div>

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
              placeholder="Tìm theo tên, loại, trạng thái..."
              className={`${inputClass} w-full pl-9 pr-3`}
            />
          </div>

          <span className="ml-auto flex items-center gap-2 whitespace-nowrap text-xs text-slate-500">
            {/* Đang cập nhật ngầm khi đã có dữ liệu đệm hiển thị sẵn */}
            {isValidating && items !== null && (
              <span className="flex items-center gap-1 text-sky-600">
                <Loader2 size={12} className="animate-spin" /> Đang cập nhật
              </span>
            )}
            {filtered.length} đường đi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-slate-50">
              <tr>
                <th className={thClass}>ID</th>
                <th className={thClass}>Tên đường đi</th>
                <th className={thClass}>Loại</th>
                <th className={thClass}>Trạng thái</th>
                <th className={thClass}>Thứ tự tầng</th>
                <th className={thClass}>Route UUID</th>
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

      <IndoorRouteFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        route={editing}
        levelId={levelId}
        placeText={placeText}
        onSaved={refetch}
      />

      <IndoorRouteDetailModal
        open={detailOpen}
        route={selected}
        venueName={venueName}
        buildingName={buildingName}
        levelName={levelName}
        onClose={() => setDetailOpen(false)}
        afterClose={() => setSelected(null)}
      />
    </div>
  )
}
