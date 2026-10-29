import { useState } from 'react'
import {
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Server,
} from 'lucide-react'
import type { SysPublishedLayer } from '../../../model/IMDF.model'

export interface ActiveLayerConfig {
  layer: SysPublishedLayer
  visible: boolean
  renderMode: 'WMS' | 'WFS' | 'MVT'
  opacity: number
}

interface PublishedLayersManagerProps {
  layers: SysPublishedLayer[]
  activeLayers: Record<number, ActiveLayerConfig>
  isLoading: boolean
  onToggleLayerVisibility: (layerId: number, visible: boolean) => void
  onChangeRenderMode: (layerId: number, mode: 'WMS' | 'WFS' | 'MVT') => void
  onChangeOpacity: (layerId: number, opacity: number) => void
  onRefresh: () => void
  onDeleteLayer: (layerId: number) => void
}

export default function PublishedLayersManager({
  layers,
  activeLayers,
  isLoading,
  onToggleLayerVisibility,
  onChangeRenderMode,
  onChangeOpacity,
  onRefresh,
  onDeleteLayer,
}: PublishedLayersManagerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Layers đã xuất bản lên GeoServer
            </h3>
            <p className="text-[11px] text-slate-500">
              Quản lý các dịch vụ bản đồ OGC (WMS / WFS / Vector Tiles MVT)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition active:scale-95 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* DANH SÁCH LAYERS */}
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {layers.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Chưa có Layer nào được xuất bản</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Sau khi vẽ và chuẩn hóa các đối tượng hình học Indoor, bấm &quot;Publish Layer&quot; để đưa lên GeoServer.
            </p>
          </div>
        ) : (
          layers.map((layer) => {
            const activeConfig = activeLayers[layer.layerId] || {
              layer,
              visible: false,
              renderMode: 'WMS' as const,
              opacity: 0.85,
            }
            const isVisible = activeConfig.visible

            return (
              <div
                key={layer.layerId}
                className={`p-3.5 transition ${
                  isVisible ? 'bg-emerald-50/20' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* BẬT / TẮT VISIBILITY */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleLayerVisibility(layer.layerId, !isVisible)}
                      className={`p-2 rounded-xl transition shrink-0 ${
                        isVisible
                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
                          : 'bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                      }`}
                      title={isVisible ? 'Ẩn layer trên bản đồ' : 'Bật hiển thị layer trên bản đồ'}
                    >
                      {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800">
                          {layer.displayName || layer.layerName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {layer.workspace}:{layer.layerName}
                        </span>
                        {layer.isPublished && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            PUBLISHED
                          </span>
                        )}
                      </div>

                      {layer.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {layer.description}
                        </p>
                      )}

                      {/* CHỌN NGUỒN HIỂN THỊ (RENDER MODE) */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-slate-400 font-medium">Nguồn dữ liệu:</span>
                          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
                            {(['WMS', 'WFS', 'MVT'] as const).map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => onChangeRenderMode(layer.layerId, mode)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                                  activeConfig.renderMode === mode
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ĐỘ TRONG SUỐT (OPACITY) */}
                        {isVisible && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span>Độ trong suốt:</span>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={activeConfig.opacity}
                              onChange={(e) =>
                                onChangeOpacity(layer.layerId, parseFloat(e.target.value))
                              }
                              className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="font-mono text-[10px] text-slate-700">
                              {Math.round(activeConfig.opacity * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS: COPY URLs, XÓA */}
                  <div className="flex items-center gap-1">
                    {layer.wmsUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopy(layer.wmsUrl!, `wms-${layer.layerId}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Sao chép WMS Endpoint URL"
                      >
                        {copiedId === `wms-${layer.layerId}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteLayer(layer.layerId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Gỡ layer khỏi hệ thống"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
