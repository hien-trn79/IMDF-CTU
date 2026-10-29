import {
  Magnet,
  Check,
  Undo2,
  X,
  Square,
  Minus,
  MapPin,
  Sparkles,
} from 'lucide-react'
import type { DrawingGeometryMode, IMDFFeatureType } from '../../../model/IMDF.model'

interface IndoorDrawingToolbarProps {
  drawingMode: DrawingGeometryMode
  targetFeatureType: IMDFFeatureType
  snapEnabled: boolean
  vertexCount: number
  areaSqm: number
  lengthMeters: number
  onStartDrawing: (mode: DrawingGeometryMode, featureType: IMDFFeatureType) => void
  onToggleSnap: () => void
  onUndo: () => void
  onFinish: () => void
  onCancel: () => void
}

const FEATURE_TYPE_OPTIONS: { value: IMDFFeatureType; label: string; icon: string }[] = [
  { value: 'unit', label: 'Unit (Phòng / Khu vực)', icon: '🚪' },
  { value: 'building', label: 'Building (Tòa nhà)', icon: '🏢' },
  { value: 'level', label: 'Level (Mặt bằng tầng)', icon: '📐' },
  { value: 'opening', label: 'Opening (Lối đi / Cửa)', icon: '↔️' },
  { value: 'door', label: 'Door (Cửa ra vào)', icon: '🚪' },
  { value: 'fixture', label: 'Fixture (Trang thiết bị)', icon: '🪑' },
  { value: 'footprint', label: 'Footprint (Móng / Chu vi)', icon: '🗺️' },
  { value: 'anchor', label: 'Anchor (Điểm định vị POI)', icon: '📍' },
]

export default function IndoorDrawingToolbar({
  drawingMode,
  targetFeatureType,
  snapEnabled,
  vertexCount,
  areaSqm,
  lengthMeters,
  onStartDrawing,
  onToggleSnap,
  onUndo,
  onFinish,
  onCancel,
}: IndoorDrawingToolbarProps) {
  const isDrawing = drawingMode !== 'none'

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 max-w-[95%]">
      {/* TOOLBAR NỔI TRÊN BẢN ĐỒ */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 transition-all duration-200">
        {!isDrawing ? (
          <>
            {/* 1. Chọn loại Feature IMDF */}
            <div className="flex items-center gap-1.5 pl-2 pr-1 border-r border-slate-700/70">
              <span className="text-xs font-semibold text-slate-400">Lớp IMDF:</span>
              <select
                value={targetFeatureType}
                onChange={(e) => {
                  const ft = e.target.value as IMDFFeatureType
                  // Gợi ý mode hình học phù hợp
                  onStartDrawing('none', ft)
                }}
                className="bg-slate-800 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {FEATURE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-800">
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Công cụ vẽ: Polygon, MultiPolygon, LineString, Point */}
            <div className="flex items-center gap-1 px-1">
              <button
                type="button"
                onClick={() => onStartDrawing('polygon', targetFeatureType)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm hover:shadow active:scale-95"
                title="Vẽ vùng Polygon khép kín (Phòng, Tòa nhà, Footprint)"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Vẽ Polygon</span>
              </button>

              <button
                type="button"
                onClick={() => onStartDrawing('linestring', targetFeatureType)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition active:scale-95 border border-slate-700"
                title="Vẽ đường LineString (Cửa, Lối mở, Tường ranh giới)"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Vẽ LineString</span>
              </button>

              <button
                type="button"
                onClick={() => onStartDrawing('point', targetFeatureType)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition active:scale-95 border border-slate-700"
                title="Chấm điểm Point (Anchor, Fixture, Điểm POI)"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Vẽ Point</span>
              </button>
            </div>

            {/* 3. Nút Bật/Tắt Snapping */}
            <div className="pl-1 border-l border-slate-700/70">
              <button
                type="button"
                onClick={onToggleSnap}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 ${
                  snapEnabled
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                }`}
                title={snapEnabled ? 'Snapping đang BẬT: Hút vào đỉnh (Vertex) & cạnh (Edge)' : 'Snapping đang TẮT'}
              >
                <Magnet className={`w-3.5 h-3.5 ${snapEnabled ? 'text-emerald-400 animate-pulse' : ''}`} />
                <span>Snap {snapEnabled ? 'Bật' : 'Tắt'}</span>
              </button>
            </div>
          </>
        ) : (
          /* TRẠNG THÁI ĐANG VẼ: HUD ĐIỀU KHIỂN & CHỈ SỐ */
          <div className="flex items-center gap-2 px-2 py-0.5">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Đang vẽ {drawingMode} ({targetFeatureType})
              </span>
            </div>

            {/* Dynamic Realtime Metrics */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                Đỉnh: <strong className="text-white">{vertexCount}</strong>
              </span>

              {areaSqm > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-800 text-blue-200">
                  Diện tích: <strong className="text-blue-300">{areaSqm.toFixed(1)} m²</strong>
                </span>
              )}

              {lengthMeters > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800 text-amber-200">
                  Độ dài: <strong className="text-amber-300">{lengthMeters.toFixed(1)} m</strong>
                </span>
              )}
            </div>

            {/* Snapping status quick toggle */}
            <button
              type="button"
              onClick={onToggleSnap}
              className={`p-1.5 rounded-lg text-xs transition border ${
                snapEnabled
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title="Bật / Tắt Snapping"
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>

            {/* Buttons: Undo, Finish, Cancel */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
              <button
                type="button"
                onClick={onUndo}
                disabled={vertexCount === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Quay lại 1 điểm (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Hoàn tác</span>
              </button>

              <button
                type="button"
                onClick={onFinish}
                disabled={
                  (drawingMode === 'point' && vertexCount < 1) ||
                  (drawingMode === 'linestring' && vertexCount < 2) ||
                  ((drawingMode === 'polygon' || drawingMode === 'multipolygon') && vertexCount < 3)
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
                title="Hoàn thành & Gửi chuẩn hóa IMDF (Enter)"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Hoàn thành</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg text-xs font-medium bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800 transition"
                title="Hủy vẽ (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GỢI Ý THAO TÁC KHI ĐANG VẼ */}
      {isDrawing && (
        <div className="bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[11px] px-3 py-1 rounded-full border border-slate-700/60 shadow-lg flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>
            Click chuột để đặt điểm. Click đúp hoặc nhấn <strong>Enter</strong> để kết thúc. Nhấn{' '}
            <strong>Ctrl+Z</strong> để lùi điểm, <strong>Esc</strong> để hủy.
          </span>
        </div>
      )}
    </div>
  )
}
