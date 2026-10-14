import {
  Building2,
  DoorOpen,
  Layers3,
  MapPin,
  Plus,
  RotateCcw,
  SquareStack,
  Waypoints,
  Building,
} from 'lucide-react'
import { useLayer } from '../../context/LayerContext'
import { getLayerLabel } from './outdoorTypes'

const layerIcons = [Building2, MapPin, SquareStack, Waypoints, DoorOpen]

export default function OutdoorSidebar({
  objectCount: _objectCount,
  onCreate,
}: {
  // props ve so luong doi tuong hien thi tren ban do va ham xu ly khi nguoi dung muon them doi tuong moi
  objectCount: number
  // ham xu ly khi nguoi dung muon them doi tuong moi
  onCreate: () => void
}) {
  const {
    selectedLayers,
    availableLayers,
    toggleLayer,
    refreshLayers,
    isLoadingLayers,
    layerCatalogError,
  } = useLayer()
  return (
    <aside className="page-ourdoor-sidebar w-full shrink-0 space-y-4 sm:w-70 lg:w-72.5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-300 pb-3 text-sm font-bold text-blue-700">
          <span className="flex items-center gap-2">
            <Building className="h-4 w-4 fill-slate-300 text-slate-300" />
            Quản lý layer imdf
          </span>
          <Layers3 className="h-4 w-4 text-slate-400" />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            onClick={refreshLayers}
            disabled={isLoadingLayers}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoadingLayers ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <button
            onClick={onCreate}
            title="Thêm feature mới lên layer đang chọn"
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" /> Thêm đối tượng
          </button>
        </div>
        <div className="space-y-1.5 rounded-xl bg-slate-50 p-2">
          {availableLayers.map((layer, index) => {
            const Icon = layerIcons[index % layerIcons.length]
            const checked = selectedLayers.some((selected) => selected.id === layer.id)
            return (
              <label
                key={layer.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border-l-4 px-3 py-3 shadow-sm transition ${checked ? 'border-blue-500 bg-white' : 'border-transparent bg-slate-100/70 hover:bg-white'}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLayer(layer)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <Icon
                    className={`h-4 w-4 shrink-0 ${checked ? 'text-blue-600' : 'text-slate-400'}`}
                  />
                  <span className="truncate text-xs font-medium text-slate-600">
                    {getLayerLabel(layer.layerName)}
                  </span>
                </span>
                {checked && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                    Hiện
                  </span>
                )}
              </label>
            )
          })}
        </div>
        {layerCatalogError && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
            Không đọc được danh sách layer: {layerCatalogError}
          </p>
        )}
        <p className="mt-2 px-1 text-[10px] text-slate-400">
          Chọn checkbox để bật/tắt layer trên bản đồ.
        </p>
      </section>
    </aside>
  )
}
