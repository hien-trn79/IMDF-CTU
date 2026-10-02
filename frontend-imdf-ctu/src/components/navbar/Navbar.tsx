import { FileCodeCorner, Route, ChevronRight, Compass, GitBranch } from 'lucide-react'
import { useState } from 'react'
import { useLayer } from '../../context/LayerContext'
import { useNavigation } from '../../context/NavigationContext'

const LAYER_CHILDREN = [
  { id: 'file-cntt-outline', label: 'cntt-outline', layerName: 'imdf_ctu:cntt-outline', to: '' },
  {
    id: 'file-ctu-buildings',
    label: 'ctu_buildings_4326',
    layerName: 'imdf_ctu:ctu_buildings_4326',
    to: ''
  },
  { id: 'file-unit', label: 'unit_4326', layerName: 'imdf_ctu:unit_4326', to: '' },
  { id: 'file-wall', label: 'wall', layerName: 'imdf_ctu:wall', to: '' },
  { id: 'file-opening', label: 'opening', layerName: 'imdf_ctu:opening', to: '' },
  { id: 'file-amenity', label: 'amenity', layerName: 'imdf_ctu:amenity', to: '' },
  { id: 'file-anchors', label: 'anchors', layerName: 'imdf_ctu:anchors', to: '' },
]

export default function Navbar() {
  const { activeView, setActiveView } = useNavigation()
  const { isLayerSelected, toggleLayer, clearLayers, selectedLayers } = useLayer()
  const [showLayers, setShowLayers] = useState<boolean>(true)

  return (
    <nav className="navbar border border-gray-200 rounded-2xl p-3 w-64 flex flex-col gap-2 bg-white shadow-sm h-full overflow-y-auto">
      
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 mt-2 px-2">
        Menu Quản lý
      </div>

      {/* Module 1: Quản lý tuyến đường nội khu */}
      <div
        className={`navbar-item py-2.5 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
          activeView === 'indoor-routes'
            ? 'bg-sky-50 text-sky-800 border-l-4 border-sky-600 shadow-2xs'
            : 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-sky-700'
        }`}
        onClick={() => setActiveView('indoor-routes')}
      >
        <div className="flex items-center gap-2.5">
          <Route className={`w-4 h-4 ${activeView === 'indoor-routes' ? 'text-sky-600' : 'text-gray-500'}`} />
          <span>Tuyến đường nội khu</span>
        </div>
        <span className="text-[10px] bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full">
          CRUD
        </span>
      </div>

      {/* Module 2: Quản lý GridLine */}
      <div
        className={`navbar-item py-2.5 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
          activeView === 'grid-lines'
            ? 'bg-sky-50 text-sky-800 border-l-4 border-sky-600 shadow-2xs'
            : 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-sky-700'
        }`}
        onClick={() => setActiveView('grid-lines')}
      >
        <div className="flex items-center gap-2.5">
          <GitBranch className={`w-4 h-4 ${activeView === 'grid-lines' ? 'text-sky-600' : 'text-gray-500'}`} />
          <span>Đường lưới (GridLine)</span>
        </div>
        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
          Map
        </span>
      </div>

      {/* Module 3: Bản đồ & Lớp dữ liệu (Layers) */}
      <div
        className={`navbar-item py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
          activeView === 'map'
            ? 'bg-sky-50 text-sky-800 border-l-4 border-sky-600 shadow-2xs'
            : 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-sky-700'
        }`}
      >
        <div 
          className="item-label flex items-center justify-between cursor-pointer"
          onClick={() => {
            setActiveView('map')
            setShowLayers(!showLayers)
          }}
        >
          <span className="flex items-center gap-2.5">
            <Compass className={`w-4 h-4 ${activeView === 'map' ? 'text-sky-600' : 'text-gray-500'}`} />
            Bản đồ WFS Layers
            {selectedLayers.length > 0 && (
              <span className="text-xs bg-sky-600 text-white rounded-full px-2 py-0.5 ml-1">
                {selectedLayers.length}
              </span>
            )}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-300 ${
              activeView === 'map' && showLayers ? 'rotate-90 text-sky-600' : 'text-gray-400'
            }`}
          />
        </div>

        {/* Layer list - only show when map view is active and showLayers is true */}
        {activeView === 'map' && showLayers && (
          <div className="item-children mt-3 space-y-1">
            <div className="flex justify-between items-center px-2 mb-2">
              <span className="text-xs font-semibold text-gray-500">Các lớp bản đồ (GeoServer)</span>
              {selectedLayers.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); clearLayers(); }}
                  className="text-[10px] text-red-500 hover:text-red-700 hover:underline cursor-pointer bg-red-50 px-2 py-0.5 rounded"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>
            {LAYER_CHILDREN.map((child) => (
              <div
                className={`child-item flex items-center gap-2 py-1.5 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
                  isLayerSelected(child.id)
                    ? 'bg-sky-100 text-sky-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                key={child.id}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLayer(child)
                }}
              >
                <FileCodeCorner className={`w-3.5 h-3.5 ${isLayerSelected(child.id) ? 'text-sky-600' : 'text-gray-400'}`} />
                <span className="truncate">{child.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <p className="text-xs text-amber-800 font-medium">
            CTU Indoor Mapping
          </p>
          <p className="text-[10px] text-amber-700/80 mt-1">
            Hệ thống quản lý dữ liệu bản đồ nội khu và đường đi thông minh.
          </p>
        </div>
      </div>
    </nav>
  )
}
