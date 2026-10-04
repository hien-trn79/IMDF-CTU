import { useNavigation } from '../context/NavigationContext'
import { Route, Layers, GitBranch } from 'lucide-react'

export default function Header() {
  const { activeView, setActiveView } = useNavigation()

  return (
    <div className="app-header py-3 pl-4 pr-4 flex items-center justify-between border-b border-gray-200 bg-gray-50/50 shadow-sm h-full">
      <div className="flex items-center gap-3">
        <div className="logo-ctu">
          <img src="/ctu-logo.png" alt="CTU Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
        </div>
        <div className="web-name">
          <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-700 to-indigo-600 tracking-tight">
            CTUMapping
          </h1>
        </div>
      </div>

      <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 shadow-inner">
        <button
          onClick={() => setActiveView('indoor-routes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeView === 'indoor-routes'
              ? 'bg-white text-sky-700 shadow-2xs font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>Tuyến đường</span>
        </button>

        <button
          onClick={() => setActiveView('grid-lines')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeView === 'grid-lines'
              ? 'bg-white text-sky-700 shadow-2xs font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>GridLine</span>
        </button>

        <button
          onClick={() => setActiveView('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeView === 'map'
              ? 'bg-white text-sky-700 shadow-2xs font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bản đồ Layers</span>
        </button>
      </div>
    </div>
  )
}
