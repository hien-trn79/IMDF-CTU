import { FileCodeCorner } from 'lucide-react'
import { useState } from 'react'
import { useLayer } from '../../context/LayerContext'

const NAV_LINKS = [
  {
    label: 'Quản lý layers',
    children: [
      { id: 'file-cntt-outline', label: 'cntt-outline', layerName: 'imdf_ctu:cntt-outline' },
      {
        id: 'file-ctu-buildings',
        label: 'ctu_buildings_4326',
        layerName: 'imdf_ctu:ctu_buildings_4326',
      },
      { id: 'file-unit', label: 'unit_4326', layerName: 'imdf_ctu:unit_4326' },
      { id: 'file-wall', label: 'wall', layerName: 'imdf_ctu:wall' },
      { id: 'file-opening', label: 'opening', layerName: 'imdf_ctu:opening' },
      { id: 'file-amenity', label: 'amenity', layerName: 'imdf_ctu:amenity' },
      { id: 'file-anchors', label: 'anchors', layerName: 'imdf_ctu:anchors' },
    ],
  },
  {
    label: 'Quản lý bản đồ',
  },
]

export default function Navbar() {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [showChildren, setShowChildren] = useState<boolean>(true)

  const { isLayerSelected, toggleLayer, clearLayers, selectedLayers } = useLayer()

  return (
    <nav className="navbar border border-gray-200 rounded-2xl p-3 w-64">
      {NAV_LINKS.map((item, index) => {
        return (
          <div
            className={`navbar-item bg-sky-50 py-2 px-3 rounded-xl text-md font-semibold text-gray-700 mb-2 ${
              activeIndex === index ? 'border-l-4 border-sky-600' : ''
            }`}
            key={index}
            onClick={() => setActiveIndex(index)}
          >
            <div className="item-label flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                {item.label}
                {item.children && selectedLayers.length > 0 && (
                  <span className="text-xs bg-sky-600 text-white rounded-full px-2 py-0.5">
                    {selectedLayers.length}
                  </span>
                )}
              </span>

              {item.children && (
                <svg
                  className={`w-4 h-4 ml-2 inline-block transition-transform duration-300 ${
                    activeIndex === index && showChildren ? 'transform rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowChildren(!showChildren)
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>

            {/* Render danh sách layer con - cho phép chọn nhiều (checkbox) */}
            {activeIndex === index && item.children && showChildren && (
              <div className="ml-2 mt-3 space-y-2">
                {item.children.map((child) => {
                  const isActive = isLayerSelected(child.id)

                  return (
                    <div
                      key={child.id}
                      className={`flex items-center py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-sky-700 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-sky-100 hover:text-sky-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLayer({ id: child.id, layerName: child.layerName, to: '' })
                      }}
                    >
                      {/* Checkbox thể hiện trạng thái chọn nhiều */}
                      <input
                        type="checkbox"
                        checked={isActive}
                        readOnly
                        className="mr-2 shrink-0 accent-sky-600 pointer-events-none"
                      />
                      <FileCodeCorner
                        className={`w-4 h-4 mr-2 shrink-0 ${isActive ? 'text-white' : 'text-sky-600'}`}
                      />
                      <span className="truncate">{child.label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center gap-2">
              {item.children && selectedLayers.length > 0 && (
                <button
                  className="text-xs text-sky-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearLayers()
                  }}
                >
                  Bỏ chọn hết
                </button>
              )}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
