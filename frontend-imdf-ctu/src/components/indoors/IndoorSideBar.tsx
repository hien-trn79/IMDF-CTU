import { Layers3, Plus, RotateCcw, Waypoints } from 'lucide-react'
import { useState } from 'react'

export default function IndoorSideBar() {
  const [isLoadingLayers, setIsLoadingLayers] = useState(false)

  const onCreate = () => {
    console.log('Thêm Dữ liệu Indoor mới lên layer đang chọn')
  }
  return (
    <aside className="page-ourdoor-sidebar w-full shrink-0 space-y-4 sm:w-70 lg:w-72.5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-300 pb-3 text-sm font-bold text-blue-700">
          <span className="flex items-center gap-2">
            <Waypoints className="h-4 w-4 fill-slate-300 text-slate-300" />
            Quản lý nội khu (Indoor Topology)
          </span>
          {/* <Layers3 className="h-4 w-4 text-slate-400" /> */}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60">
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
        <div className="space-y-1.5 rounded-xl bg-slate-50 p-2"></div>
        {/* {layerCatalogError && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
            Không đọc được danh sách layer: {layerCatalogError}
          </p>
        )} */}
        <p className="mt-2 px-1 text-[10px] text-slate-400">
          Chọn checkbox để bật/tắt layer trên bản đồ.
        </p>
      </section>
    </aside>
  )
}
