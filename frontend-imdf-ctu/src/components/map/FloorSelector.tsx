import { ChevronDown, Layers, AlertTriangle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useMapNavigation } from '../../context/MapNavigationContext'

interface FloorSelectorProps {
  /** Danh sách các tầng có sẵn sơ đồ (VD: ['G', '1', '2']) */
  availableFloors?: string[]
  /** Tổng số tầng của toà nhà */
  totalFloors?: string[]
}

export default function FloorSelector({
  availableFloors = [],
  totalFloors = ['G', '1', '2', '3'],
}: FloorSelectorProps) {
  const { selectedFloor, setSelectedFloor } = useMapNavigation()
  const [isOpen, setIsOpen] = useState(false)
  const [showNoFloorPlan, setShowNoFloorPlan] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectFloor = (floor: string) => {
    setSelectedFloor(floor)
    setIsOpen(false)

    // Kiểm tra xem tầng có sơ đồ không
    if (!availableFloors.includes(floor)) {
      setShowNoFloorPlan(true)
      setTimeout(() => setShowNoFloorPlan(false), 3000)
    } else {
      setShowNoFloorPlan(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Nút chọn tầng */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-2xl bg-white text-slate-700 shadow-xl border border-slate-200 hover:bg-sky-50 hover:text-blue-600 active:scale-95 transition cursor-pointer px-3 py-2.5"
        title="Chọn tầng xem sơ đồ"
      >
        <Layers size={17} />
        <span className="text-xs font-bold min-w-[20px] text-center">
          {selectedFloor === 'G' ? 'G' : `T${selectedFloor}`}
        </span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown tầng */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-44 rounded-2xl border border-slate-100 bg-white/98 p-1.5 shadow-xl backdrop-blur-md z-[1100] animate-in fade-in-50 slide-in-from-bottom-2 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers size={11} />
            <span>Chọn tầng</span>
          </div>

          <div className="space-y-0.5">
            {totalFloors.map((floor) => {
              const isAvailable = availableFloors.includes(floor)
              const isSelected = selectedFloor === floor

              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() => handleSelectFloor(floor)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : isAvailable
                      ? 'text-slate-700 hover:bg-sky-50 font-medium'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : isAvailable
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {floor === 'G' ? 'G' : floor}
                    </span>
                    <span>
                      {floor === 'G' ? 'Tầng trệt' : `Tầng ${floor}`}
                    </span>
                  </span>

                  {!isAvailable && (
                    <span className="text-[9px] text-slate-400 font-medium bg-slate-100 rounded-md px-1.5 py-0.5">
                      Chưa có
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Toast thông báo chưa có sơ đồ */}
      {showNoFloorPlan && (
        <div className="absolute bottom-full mb-14 right-0 w-56 rounded-2xl border border-amber-200 bg-amber-50/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md z-[1100] animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">
                Chưa có sơ đồ cho tầng này
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                Sơ đồ tầng {selectedFloor === 'G' ? 'trệt' : selectedFloor} đang được cập nhật.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
