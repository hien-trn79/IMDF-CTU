import { useEffect, useRef, useState, type CSSProperties } from 'react'
import IndoorMap from './IndoorMap'
import { Maximize2, Minimize2 } from 'lucide-react'
import IndoorSideBar from './IndoorSideBar'

export default function PageIndoors() {
  // Mở rộng toàn bộ bản đồ (Fullscreen API)
  const mapCardRef = useRef<HTMLDivElement>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  // Chiều cao bảng nổi, dùng để đẩy attribution/scale của Leaflet lên trên bảng
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)

  // Khoảng đệm quanh bản đồ: 8px ở chế độ thường, 0 khi fullscreen
  const inset = isMapFullscreen ? 0 : 8

  // Đồng bộ state khi người dùng thoát fullscreen bằng phím Esc
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(document.fullscreenElement === mapCardRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, []) // end useEffect

  const toggleMapFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await mapCardRef.current?.requestFullscreen()
      }
    } catch (error) {
      console.error('Không thể bật/tắt toàn màn hình:', error)
    }
  }
  return (
    <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-5 px-2">
      {/* INDOOR MAIN MAP + BẢNG NỔI */}
      <main className="page-outdoor-main min-w-0 lg:col-span-4">
        <div
          ref={mapCardRef}
          style={
            {
              // bảng cách đáy card 16px, chừa thêm 4px khe hở
              '--map-bottom-offset': `${panelHeight + 20 - inset}px`,
            } as CSSProperties
          }
          className={`outdoor_map relative isolate overflow-hidden bg-white [&_.leaflet-bottom]:mb-(--map-bottom-offset) ${
            isMapFullscreen
              ? 'h-screen w-screen rounded-none border-0 p-0'
              : 'h-[min(89vh,720px)] min-h-82.5 rounded-2xl border border-sky-100 p-2 shadow-sm'
          }`}
        >
          <IndoorMap />

          {/* Nút mở rộng bản đồ, nằm ngay dưới nút zoom +/- của Leaflet */}
          <button
            type="button"
            onClick={toggleMapFullscreen}
            title={isMapFullscreen ? 'Thu nhỏ bản đồ' : 'Mở rộng toàn bộ bản đồ'}
            aria-label={isMapFullscreen ? 'Thu nhỏ bản đồ' : 'Mở rộng toàn bộ bản đồ'}
            style={{ left: 10 + inset, top: 84 + inset }}
            className="absolute z-1000 flex h-8.5 w-8.5 items-center justify-center rounded border-2 border-black/20 bg-white bg-clip-padding text-slate-700 hover:bg-slate-100"
          >
            {isMapFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </main>

      {/* OUTDOOR ASIDE: chỉ là khung chứa, OutdoorSidebar tự có card riêng nên không thêm viền/padding */}
      <aside className="outdoor_aside_map min-w-0 overflow-y-auto lg:col-span-1 lg:max-h-[min(85vh,720px)] justify-items-center">
        <IndoorSideBar />
      </aside>

      {/* MODAL HIỂN THỊ THÔNG TIN CHI TIẾT */}
      {/* <FeatureDetailModal
          isOpenSelectedFeatureModal={isOpenSelectedFeatureModal}
          onClose={() => setIsOpenSelectedFeatureModal(false)}
          data={selectedFeature}
        /> */}
    </div>
  )
}
