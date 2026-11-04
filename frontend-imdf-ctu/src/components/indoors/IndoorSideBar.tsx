import { Database, Layers, Plus, RotateCcw, Square, Waypoints } from 'lucide-react'
import type { SysPublishedLayer } from '../../model/IMDF.model'
import { GRID_LINE_COLOR } from './gridLineGeoJson'
import { getLayerColor } from './useImdfLayers'

interface IndoorSideBarProps {
  // Legacy topology layers
  isLoading: boolean
  error: string | null
  gridLineCount: number
  isGridLineVisible: boolean
  onToggleGridLine: (visible: boolean) => void
  onRefresh: () => void
  setIsOpenAddIndoor: (open: boolean) => void
  nodeCount: number
  isNodeVisible: boolean
  onToggleNode: (visible: boolean) => void
  edgeCount: number
  isEdgeVisible: boolean
  onToggleEdge: (visible: boolean) => void

  // IMDF layers tu GeoServer
  imdfLayers: SysPublishedLayer[]
  imdfLayersLoading: boolean
  imdfLayersError: string | null
  visibleLayerIds: Set<number>
  onToggleImdfLayer: (layerId: number) => void
  onRefreshImdfLayers: () => void
}

export default function IndoorSideBar({
  isLoading,
  error,
  gridLineCount,
  isGridLineVisible,
  onToggleGridLine,
  onRefresh,
  setIsOpenAddIndoor,
  nodeCount,
  isNodeVisible,
  onToggleNode,
  edgeCount,
  isEdgeVisible,
  onToggleEdge,
  imdfLayers,
  imdfLayersLoading,
  imdfLayersError,
  visibleLayerIds,
  onToggleImdfLayer,
  onRefreshImdfLayers,
}: IndoorSideBarProps) {
  return (
    <aside className="page-ourdoor-sidebar w-full shrink-0 space-y-4 sm:w-70 lg:w-72.5">
      {/* Panel 1: Layer khong gian IMDF */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-300 pb-3">
          <span className="flex items-center gap-2 text-sm font-bold text-indigo-700">
            <Layers className="h-4 w-4" />
            Quản lý layer nội tuyến từ GeoServer
          </span>
          <button
            onClick={onRefreshImdfLayers}
            disabled={imdfLayersLoading}
            title="Tai lai danh sach layer"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-wait disabled:opacity-60"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${imdfLayersLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {imdfLayersError && (
          <p className="mb-2 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
            {imdfLayersError}
          </p>
        )}

        {imdfLayersLoading && (
          <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
            <RotateCcw className="h-3.5 w-3.5 animate-spin" />
            Đang tải danh sách layer từ GeoServer...
          </div>
        )}

        {!imdfLayersLoading && imdfLayers.length === 0 && !imdfLayersError && (
          <p className="py-3 text-center text-xs text-slate-400">
            Chưa có layer nào được xuất bản từ GeoServer
          </p>
        )}

        {!imdfLayersLoading && imdfLayers.length > 0 && (
          <div className="space-y-1.5 rounded-xl bg-slate-50 p-2">
            {imdfLayers.map((layer) => (
              <ImdfLayerRow
                key={layer.layerId}
                layer={layer}
                checked={visibleLayerIds.has(layer.layerId)}
                onChange={() => onToggleImdfLayer(layer.layerId)}
              />
            ))}
          </div>
        )}

        <p className="mt-2 px-1 text-[10px] text-slate-400">
          Chọn checkbox để hiển thị hoặc ẩn các layer nội tuyến từ GeoServer.
          {imdfLayers.length > 0 && ` Tong: ${imdfLayers.length} layer.`}
        </p>
      </section>

      {/* Panel 2: Topology */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-300 pb-3 text-sm font-bold text-blue-700">
          <span className="flex items-center gap-2">
            <Waypoints className="h-4 w-4 fill-slate-300 text-blue-700" />
            Topology (Đồ thị đường đi)
          </span>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <button
            onClick={() => setIsOpenAddIndoor(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" /> Thêm đối tượng
          </button>
        </div>

        <div className="space-y-1.5 rounded-xl bg-slate-50 p-2">
          <LayerRow
            checked={isGridLineVisible}
            disabled={isLoading}
            onChange={onToggleGridLine}
            color={GRID_LINE_COLOR}
            label="Đồ thị đường đi (PreTopology)"
            count={isLoading ? 'Đang tải...' : String(gridLineCount)}
            visible={isGridLineVisible}
          />
          <LayerRow
            checked={isNodeVisible}
            disabled={isLoading}
            onChange={onToggleNode}
            color="#dc2626"
            label="Đỉnh (Nodes)"
            count={isLoading ? '...' : String(nodeCount)}
            visible={isNodeVisible}
            dot
          />
          <LayerRow
            checked={isEdgeVisible}
            disabled={isLoading}
            onChange={onToggleEdge}
            color="#7c3aed"
            label="Cạnh (Edges)"
            count={isLoading ? '...' : String(edgeCount)}
            visible={isEdgeVisible}
          />
        </div>

        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
            Không đọc được danh sách từ preTopology Table: {error}
          </p>
        )}
      </section>
    </aside>
  )
}

interface ImdfLayerRowProps {
  layer: SysPublishedLayer
  checked: boolean
  onChange: () => void
}

function ImdfLayerRow({ layer, checked, onChange }: ImdfLayerRowProps) {
  const color = getLayerColor(layer.geometryType)
  const isPolygon = layer.geometryType?.toLowerCase().includes('polygon')
  const isLine = layer.geometryType?.toLowerCase().includes('line')

  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border-l-4 px-3 py-2.5 shadow-sm transition ${
        checked ? 'border-indigo-500 bg-white' : 'border-transparent bg-slate-100/70 hover:bg-white'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 accent-indigo-600"
        />
        {isPolygon ? (
          <Square
            className={`h-3.5 w-3.5 shrink-0 ${checked ? 'text-indigo-600' : 'text-slate-400'}`}
          />
        ) : isLine ? (
          <Database
            className={`h-3.5 w-3.5 shrink-0 ${checked ? 'text-indigo-600' : 'text-slate-400'}`}
          />
        ) : (
          <Layers
            className={`h-3.5 w-3.5 shrink-0 ${checked ? 'text-indigo-600' : 'text-slate-400'}`}
          />
        )}
        <span className="truncate text-xs font-medium text-slate-700">
          {layer.displayName || layer.layerName}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        {isPolygon ? (
          <span
            className="h-3 w-3 rounded border"
            style={{ backgroundColor: `${color}33`, borderColor: color }}
            aria-hidden
          />
        ) : isLine ? (
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        ) : (
          <span
            className="h-2.5 w-2.5 rounded-full border"
            style={{ backgroundColor: color, borderColor: color }}
            aria-hidden
          />
        )}
        {checked && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
            Hien
          </span>
        )}
      </span>
    </label>
  )
}

interface LayerRowProps {
  checked: boolean
  disabled: boolean
  onChange: (v: boolean) => void
  color: string
  label: string
  count: string
  visible: boolean
  dot?: boolean
}

function LayerRow({
  checked,
  disabled,
  onChange,
  color,
  label,
  count,
  visible,
  dot,
}: LayerRowProps) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border-l-4 px-3 py-3 shadow-sm transition ${
        visible ? 'border-blue-500 bg-white' : 'border-transparent bg-slate-100/70 hover:bg-white'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-blue-600"
        />
        <Waypoints className={`h-4 w-4 shrink-0 ${visible ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className="truncate text-xs font-medium text-slate-600">{label}</span>
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        {dot ? (
          <span
            className="h-2.5 w-2.5 rounded-full border"
            style={{ backgroundColor: color, borderColor: color }}
            aria-hidden
          />
        ) : (
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        )}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          {count}
        </span>
        {visible && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
            Hien
          </span>
        )}
      </span>
    </label>
  )
}
