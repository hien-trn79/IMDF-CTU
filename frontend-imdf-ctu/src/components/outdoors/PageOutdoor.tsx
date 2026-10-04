import { Building2 } from 'lucide-react'

export default function PageOutdoor() {
  return (
    <div className="page-outdoor">
      <main className="page-outdoor-main">
        {/* OUTDOOR MAP */}
        <div className="outdoor_map border border-secondary rounded-2xl p-2">hello</div>

        {/* OUTDOOR TABLE */}
        <div className="outdoor_table border border-gray-400 rounded-2xl"></div>
      </main>

      <aside className="page-ourdoor-sidebar">
        {/* OUTDOOR LIST 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-gray-500" />
            <div className=" text-xl text-primary sm:text-md">Quản lý layer imdf</div>
          </div>
        </div>
      </aside>
    </div>
  )
}
