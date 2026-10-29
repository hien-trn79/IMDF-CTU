import {
  Building2,
  Compass,
  Layers,
  Magnet,
  Plus,
  RotateCcw,
  Server,
  UploadCloud,
} from 'lucide-react'
import type { IMDFFeatureItem, IMDFFeatureType, SysPublishedLayer } from '../../../model/IMDF.model'
import type { ActiveLayerConfig } from './PublishedLayersManager'

interface IndoorManagementSidebarProps {
  isLoading: boolean
  features: IMDFFeatureItem[]
  selectedLevelId: number
  levels: Array<{ levelId?: number; id?: number; name?: string; levelName?: string; ordinal?: number }>
  onSelectLevelId: (level: number) => void
  onRefresh: () => void
  onOpenAddModal: () => void
  onOpenPublishModal: () => void
  // Layer visibility toggles
  layerVisibility: Record<IMDFFeatureType, boolean>
  onToggleLayerType: (type: IMDFFeatureType) => void
  // Snapping
  snapEnabled: boolean
  onToggleSnap: () => void
  // Quick Draw
  onQuickDraw: (type: IMDFFeatureType) => void
  // Published layers
  publishedLayers: SysPublishedLayer[]
  activePublishedLayers: Record<number, ActiveLayerConfig>
  onTogglePublishedLayer: (layerId: number, visible: boolean) => void
}

interface LayerRowProps {
  label: string
  color: string
  count: number
  visible: boolean
  onToggle: () => void
  onQuickDraw: () => void
}

function LayerRow({
  label,
  color,
  count,
  visible,
  onToggle,
  onQuickDraw,
}: LayerRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
        visible ? 'bg-white shadow-xs' : 'opacity-65 hover:opacity-100 hover:bg-slate-100/60'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <input
          type="checkbox"
          checked={visible}
          onChange={onToggle}
          className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-xs font-semibold text-slate-700">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
          {count}
        </span>
        <button
          type="button"
          onClick={onQuickDraw}
          title={`Vẽ đối tượng ${label} mới`}
          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function IndoorManagementSidebar({
  isLoading,
  features,
  selectedLevelId,
  levels,
  onSelectLevelId,
  onRefresh,
  onOpenAddModal,
  onOpenPublishModal,
  layerVisibility,
  onToggleLayerType,
  snapEnabled,
  onToggleSnap,
  onQuickDraw,
  publishedLayers,
  activePublishedLayers,
  onTogglePublishedLayer,
}: IndoorManagementSidebarProps) {
  // Đếm đối tượng theo tầng và theo loại
  const currentFloorFeatures = features.filter((f) => {
    const lvl = f.feature?.properties?.level_id
    return lvl === undefined || lvl === null || Number(lvl) === selectedLevelId
  })

  const countByType = (type: IMDFFeatureType) =>
    currentFloorFeatures.filter((f) => f.feature?.properties?.feature_type === type).length

  return (
    <aside className="page-ourdoor-sidebar w-full shrink-0 space-y-3 sm:w-70 lg:w-72.5">
      {/* SECTION 1: BẢNG ĐIỀU KHIỂN CHÍNH */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs font-bold text-blue-700">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-blue-600" />
            Quản lý Indoor (IMDF)
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200">
            ADMIN
          </span>
        </div>

        {/* TẦNG / LEVEL SELECTOR */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Chọn tầng mặt bằng:
          </label>
          <div className="relative">
            <Compass className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedLevelId}
              onChange={(e) => onSelectLevelId(Number(e.target.value))}
              className="w-full text-xs font-bold pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {(levels.length > 0 ? levels : [{ levelId: 1, name: 'Tầng 1' }]).map((level) => {
                const id = level.levelId ?? level.id ?? level.ordinal ?? 1
                return (
                  <option key={id} value={id}>
                    {level.name || level.levelName || `Tầng ${id}`}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* NÚT THAO TÁC NHANH: LÀM MỚI & THÊM ĐỐI TƯỢNG */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 transition shadow-2xs"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Vẽ đối tượng
          </button>
        </div>

        {/* NÚT PUBLISH LAYER LÊN GEOSERVER */}
        <button
          type="button"
          onClick={onOpenPublishModal}
          className="w-full flex h-9.5 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-xs shadow-emerald-600/20 active:scale-98"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Publish Layer lên GeoServer</span>
        </button>
      </section>

      {/* SECTION 2: CÁC LỚP ĐỐI TƯỢNG IMDF */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            Lớp dữ liệu không gian
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {currentFloorFeatures.length} đối tượng
          </span>
        </div>

        <div className="space-y-1 rounded-xl bg-slate-50 p-1.5 border border-slate-100">
          <LayerRow
            label="Phòng / Unit"
            color="#2563eb"
            count={countByType('unit')}
            visible={layerVisibility.unit}
            onToggle={() => onToggleLayerType('unit')}
            onQuickDraw={() => onQuickDraw('unit')}
          />

          <LayerRow
            label="Cửa / Door"
            color="#f59e0b"
            count={countByType('door')}
            visible={layerVisibility.door}
            onToggle={() => onToggleLayerType('door')}
            onQuickDraw={() => onQuickDraw('door')}
          />

          <LayerRow
            label="Lối mở / Opening"
            color="#10b981"
            count={countByType('opening')}
            visible={layerVisibility.opening}
            onToggle={() => onToggleLayerType('opening')}
            onQuickDraw={() => onQuickDraw('opening')}
          />

          <LayerRow
            label="Thiết bị / Fixture"
            color="#8b5cf6"
            count={countByType('fixture')}
            visible={layerVisibility.fixture}
            onToggle={() => onToggleLayerType('fixture')}
            onQuickDraw={() => onQuickDraw('fixture')}
          />

          <LayerRow
            label="Tòa nhà & Chu vi"
            color="#1e293b"
            count={countByType('building') + countByType('footprint')}
            visible={layerVisibility.building}
            onToggle={() => onToggleLayerType('building')}
            onQuickDraw={() => onQuickDraw('building')}
          />

          <LayerRow
            label="Điểm POI / Anchor"
            color="#ef4444"
            count={countByType('anchor')}
            visible={layerVisibility.anchor}
            onToggle={() => onToggleLayerType('anchor')}
            onQuickDraw={() => onQuickDraw('anchor')}
          />
        </div>
      </section>

      {/* SECTION 3: SNAPPING CONTROL */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Magnet className={`w-4 h-4 ${snapEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
            <div>
              <p className="text-xs font-bold text-slate-800">Bắt dính Topo (Snapping)</p>
              <p className="text-[10px] text-slate-400">Hút đỉnh (Vertex) & Cạnh (Edge)</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={onToggleSnap}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </section>

      {/* SECTION 4: GEOSERVER PUBLISHED LAYERS - checkbox tắt/bật WMS layer */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-emerald-600" />
            Layers GeoServer ({publishedLayers.length})
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">WMS / WFS</span>
        </div>

        {publishedLayers.length === 0 ? (
          <p className="text-[11px] text-slate-400 py-1 text-center">
            Chưa có layer nào được xuất bản. Bấm &quot;Publish Layer&quot; để đưa lên GeoServer.
          </p>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {publishedLayers.map((layer) => {
              const isVis = activePublishedLayers[layer.layerId]?.visible ?? false
              return (
                <label
                  key={layer.layerId}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 cursor-pointer transition ${
                    isVis ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isVis}
                      onChange={() => onTogglePublishedLayer(layer.layerId, !isVis)}
                      className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="truncate font-semibold text-[11px] text-slate-700">
                      {layer.displayName || layer.layerName}
                    </span>
                  </div>
                  {isVis && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                      Hiện
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </section>
    </aside>
  )
}
