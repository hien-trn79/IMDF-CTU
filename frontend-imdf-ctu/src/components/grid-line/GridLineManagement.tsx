import { useEffect, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, useMap, Tooltip as LeafletTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ConfigProvider, message, Alert, Button, Input, Select, Space, Spin } from 'antd'
import {
  ReloadOutlined, PlusOutlined, SearchOutlined,
  InfoCircleOutlined, BranchesOutlined, FilterOutlined
} from '@ant-design/icons'
import viVN from 'antd/locale/vi_VN'
import type { GridLineResponse } from '../../model/GridLine.model'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'
import { gridLineService } from '../../services/gridLineService'
import { indoorRouteService } from '../../services/indoorRouteService'
import { parseWKBHexToLatLngs, calcPolylineLengthMeters, formatLength, parseWKBHexToCoords } from '../../utils/wkbUtils'
import GridLineTable from './GridLineTable'
import GridLineDetailDrawer from './GridLineDetailDrawer'
import GridLineFormModal from './GridLineFormModal'

// ─── Fly-to helper ──────────────────────────────────────────────────────────
function FlyToController({ target }: { target: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 18.5, { animate: true, duration: 0.8 })
  }, [target, map])
  return null
}

// ─── Colors ─────────────────────────────────────────────────────────────────
const COLOR_NORMAL   = '#0ea5e9'   // sky-500
const COLOR_SELECTED = '#f97316'   // orange-500
const COLOR_HOVER    = '#6366f1'   // indigo-500

// ─── Main Component ──────────────────────────────────────────────────────────
export default function GridLineManagement() {
  const [gridLines, setGridLines]     = useState<GridLineResponse[]>([])
  const [indoorRoutes, setIndoorRoutes] = useState<IndoorRouteResponse[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState<string | null>(null)

  // selection / hover
  const [selectedId, setSelectedId]   = useState<number | null>(null)
  const [hoveredId, setHoveredId]     = useState<number | null>(null)
  const [flyTarget, setFlyTarget]     = useState<[number, number] | null>(null)

  // filters
  const [searchText, setSearchText]   = useState('')
  const [filterRoute, setFilterRoute] = useState<number | undefined>(undefined)
  const [filterOneWay, setFilterOneWay] = useState<string | undefined>(undefined)
  const [filterCat, setFilterCat]     = useState<string | undefined>(undefined)

  // UI state
  const [detailGl, setDetailGl]       = useState<GridLineResponse | null>(null)
  const [editingGl, setEditingGl]     = useState<GridLineResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<number | null>(null)

  // ─── Load data ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [glData, routeData] = await Promise.all([
        gridLineService.getAll(),
        indoorRouteService.getAll(),
      ])
      setGridLines(Array.isArray(glData) ? glData : [])
      setIndoorRoutes(Array.isArray(routeData) ? routeData : [])
    } catch (err: any) {
      setLoadError(err?.message ?? 'Không thể tải dữ liệu từ Backend.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return gridLines.filter((gl) => {
      if (searchText) {
        const q = searchText.toLowerCase()
        if (
          !gl.id.toString().includes(q) &&
          !gl.gridLineId.toLowerCase().includes(q) &&
          !gl.indoorRouteName.toLowerCase().includes(q) &&
          !gl.category.toLowerCase().includes(q)
        ) return false
      }
      if (filterRoute !== undefined && gl.indoorRouteId !== filterRoute) return false
      if (filterOneWay !== undefined) {
        if (filterOneWay === 'one' && !gl.isOneWay) return false
        if (filterOneWay === 'two' && gl.isOneWay) return false
      }
      if (filterCat && gl.category !== filterCat) return false
      return true
    })
  }, [gridLines, searchText, filterRoute, filterOneWay, filterCat])

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingGl(null); setSubmitError(null); setIsModalOpen(true)
  }
  const handleOpenEdit = (gl: GridLineResponse) => {
    setEditingGl(gl); setSubmitError(null); setIsModalOpen(true)
  }
  const handleSubmit = async (data: any) => {
    setSubmitting(true); setSubmitError(null)
    try {
      if (editingGl) {
        const updated = await gridLineService.update(editingGl.id, data)
        setGridLines((prev) => prev.map((g) => g.id === editingGl.id ? updated : g))
        if (detailGl?.id === editingGl.id) setDetailGl(updated)
        message.success('Cập nhật GridLine thành công!')
      } else {
        const created = await gridLineService.create(data)
        setGridLines((prev) => [created, ...prev])
        message.success('Tạo GridLine thành công!')
      }
      setIsModalOpen(false); setEditingGl(null)
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Lỗi khi lưu dữ liệu.')
    } finally {
      setSubmitting(false)
    }
  }
  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await gridLineService.delete(id)
      setGridLines((prev) => prev.filter((g) => g.id !== id))
      if (detailGl?.id === id) setDetailGl(null)
      if (selectedId === id) setSelectedId(null)
      message.success('Đã xóa GridLine!')
    } catch (err: any) {
      message.error(err?.message ?? 'Lỗi khi xóa.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleFlyTo = (gl: GridLineResponse) => {
    const coords = parseWKBHexToCoords(gl.geom)
    if (coords.length === 0) return
    const midIdx = Math.floor(coords.length / 2)
    const [lng, lat] = coords[midIdx]
    setSelectedId(gl.id)
    setFlyTarget([lat, lng])
  }

  // ─── Map polylines ─────────────────────────────────────────────────────────
  const mapPolylines = useMemo(() => {
    const filteredIds = new Set(filtered.map((g) => g.id))
    return gridLines
      .filter((gl) => parseWKBHexToLatLngs(gl.geom).length >= 2)
      .map((gl) => {
        const latLngs = parseWKBHexToLatLngs(gl.geom)
        const inFilter = filteredIds.has(gl.id)
        const isSelected = gl.id === selectedId
        const isHovered  = gl.id === hoveredId

        const color  = isSelected ? COLOR_SELECTED : isHovered ? COLOR_HOVER : COLOR_NORMAL
        const weight = isSelected ? 6 : isHovered ? 4.5 : 3
        const opacity = inFilter ? 1 : 0.2

        const coords = parseWKBHexToCoords(gl.geom)
        const lenStr = formatLength(calcPolylineLengthMeters(coords))

        return { gl, latLngs, color, weight, opacity, lenStr }
      })
  }, [gridLines, filtered, selectedId, hoveredId])

  const centerPos: [number, number] = [10.03031, 105.76843]

  return (
    <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#0284c7', borderRadius: 10, fontFamily: 'inherit' } }}>
      <div className="h-full flex flex-col min-h-0 bg-slate-50/50">

        {/* ── Header ── */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <BranchesOutlined className="text-sky-600" />
                Quản lý GridLine – Đường Lưới Nội Khu
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                IMDF CTU · Trường CNTT&TT – Đại học Cần Thơ · API: /api/grid-lines
              </p>
            </div>
            <Space>
              <Button icon={<ReloadOutlined spin={loading} />} onClick={fetchAll} disabled={loading}>
                Làm mới
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}
                className="bg-sky-600 hover:bg-sky-500">
                Thêm GridLine
              </Button>
            </Space>
          </div>
        </div>

        {/* ── Error ── */}
        {loadError && (
          <div className="px-4 pb-2">
            <Alert type="error" showIcon message="Lỗi kết nối Backend"
              description={loadError}
              action={<Button size="small" icon={<ReloadOutlined />} onClick={fetchAll}>Thử lại</Button>}
            />
          </div>
        )}

        {/* ── Map + Panel split ── */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 px-4 pb-4">

          {/* ═══ MAP ═══ */}
          <div className="flex-1 min-h-[320px] rounded-2xl overflow-hidden border border-sky-400 shadow-sm relative">

            {/* Stats badge */}
            <div className="absolute top-3 left-3 z-[800] flex gap-2 flex-wrap">
              <span className="bg-white/90 text-xs font-semibold px-2.5 py-1 rounded-full shadow text-gray-700 border border-gray-200">
                {filtered.length} / {gridLines.length} đường
              </span>
              {selectedId && (
                <span className="bg-orange-100 text-xs font-semibold px-2.5 py-1 rounded-full shadow text-orange-700 border border-orange-200">
                  Đang chọn: #{selectedId}
                </span>
              )}
            </div>

            {loading && (
              <div className="absolute inset-0 z-[900] bg-white/70 flex items-center justify-center">
                <Spin tip="Đang tải dữ liệu bản đồ..." />
              </div>
            )}

            <MapContainer
              center={centerPos}
              zoom={17}
              minZoom={12}
              maxZoom={22}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxNativeZoom={19}
                maxZoom={22}
              />

              <FlyToController target={flyTarget} />

              {mapPolylines.map(({ gl, latLngs, color, weight, opacity, lenStr }) => (
                <Polyline
                  key={gl.id}
                  positions={latLngs}
                  pathOptions={{ color, weight, opacity }}
                  eventHandlers={{
                    click: () => {
                      setSelectedId(gl.id)
                      setDetailGl(gl)
                    },
                    mouseover: () => setHoveredId(gl.id),
                    mouseout:  () => setHoveredId(null),
                  }}
                >
                  <LeafletTooltip sticky direction="top">
                    <div className="text-xs space-y-0.5">
                      <div><b>#{gl.id}</b> · {gl.category}</div>
                      <div>{gl.isOneWay ? '→ Một chiều' : '↔ Hai chiều'}</div>
                      <div>Dài: {lenStr}</div>
                      <div className="text-gray-500">{gl.indoorRouteName}</div>
                    </div>
                  </LeafletTooltip>
                </Polyline>
              ))}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-3 right-3 z-[800] bg-white/90 rounded-xl px-3 py-2 shadow border border-gray-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-sky-500 rounded" />
                <span className="text-gray-600">Bình thường</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-indigo-500 rounded" />
                <span className="text-gray-600">Hover</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-orange-500 rounded" />
                <span className="text-gray-600">Đang chọn</span>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT PANEL ═══ */}
          <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-3">

            {/* Filter toolbar */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 mb-2.5">
                <FilterOutlined className="text-sky-600 text-sm" />
                <span className="text-sm font-semibold text-gray-700">Tìm kiếm & Lọc</span>
              </div>
              <div className="space-y-2">
                <Input
                  size="small"
                  prefix={<SearchOutlined className="text-gray-400" />}
                  placeholder="Tìm theo ID, UUID, tên, loại..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
                <Select
                  size="small" className="w-full" allowClear
                  placeholder="Tất cả tuyến đường"
                  value={filterRoute}
                  onChange={setFilterRoute}
                  options={indoorRoutes.map((r) => ({ label: `#${r.id} ${r.indoorRouteName}`, value: r.id }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    size="small" allowClear
                    placeholder="Phân loại"
                    value={filterCat}
                    onChange={setFilterCat}
                    options={[
                      { label: 'grid_line', value: 'grid_line' },
                      { label: 'corridor', value: 'corridor' },
                      { label: 'stairs', value: 'stairs' },
                      { label: 'elevator', value: 'elevator' },
                      { label: 'emergency', value: 'emergency' },
                    ]}
                  />
                  <Select
                    size="small" allowClear
                    placeholder="Chiều lưu thông"
                    value={filterOneWay}
                    onChange={setFilterOneWay}
                    options={[
                      { label: 'Một chiều', value: 'one' },
                      { label: 'Hai chiều', value: 'two' },
                    ]}
                  />
                </div>
                {(searchText || filterRoute !== undefined || filterCat || filterOneWay) && (
                  <Button type="link" size="small" className="px-0 text-xs"
                    onClick={() => { setSearchText(''); setFilterRoute(undefined); setFilterCat(undefined); setFilterOneWay(undefined) }}>
                    Đặt lại bộ lọc
                  </Button>
                )}
              </div>
            </div>

            {/* Stats mini */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Tổng GridLine', value: gridLines.length, color: 'text-sky-600 bg-sky-50 border-sky-200' },
                { label: 'Đang lọc', value: filtered.length, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
              ].map((s) => (
                <div key={s.label} className={`p-2.5 rounded-xl border text-center ${s.color}`}>
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className="text-[11px] font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                <InfoCircleOutlined className="text-sky-600 text-sm" />
                <span className="text-xs font-semibold text-gray-600">
                  Danh sách GridLine — click hàng để chọn
                </span>
              </div>
              <div className="overflow-auto">
                <GridLineTable
                  gridLines={filtered}
                  loading={loading}
                  selectedId={selectedId}
                  onView={(gl) => { setDetailGl(gl); setSelectedId(gl.id) }}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onFlyTo={handleFlyTo}
                  deletingId={deletingId}
                  onOpenCreate={handleOpenCreate}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Detail Drawer ── */}
        <GridLineDetailDrawer
          open={!!detailGl}
          onClose={() => setDetailGl(null)}
          gridLine={detailGl}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          deleting={deletingId === detailGl?.id}
        />

        {/* ── Form Modal ── */}
        <GridLineFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingGl(null) }}
          onSubmit={handleSubmit}
          initialData={editingGl}
          indoorRoutes={indoorRoutes}
          submitting={submitting}
          error={submitError}
        />
      </div>
    </ConfigProvider>
  )
}
