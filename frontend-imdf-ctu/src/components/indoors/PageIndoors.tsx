import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import IndoorMap from './IndoorMap'
import IndoorSideBar from './IndoorSideBar'
import { useGridLines } from './useGridLines'
import type { IndoorFeatureItem } from './IndoorTable'
import IndoorTable from '../indoors/IndoorTable'
import FeatureDetailModal from '../outdoors/FeatureDetailModal'

const GRID_LINE_LAYER = { id: 'grid_line', layerName: 'Đường lưới (Grid lines)' }

export default function PageIndoors() {
  // Feature đang chọn (từ bảng hoặc từ click trên bản đồ)
  const [selectedFeature, setSelectedFeature] = useState<IndoorFeatureItem | null>(null)
  const [isOpenSelectedFeatureModal, setIsOpenSelectedFeatureModal] = useState(false)

  // Mở rộng toàn bộ bản đồ (Fullscreen API)
  const mapCardRef = useRef<HTMLDivElement>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  // Chiều cao bảng nổi, dùng để đẩy attribution/scale của Leaflet lên trên bảng
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)

  // Dữ liệu grid line: gọi API ở một chỗ duy nhất rồi truyền cho sidebar, map và bảng
  const { geoJson, gridLines, isLoading, error, reload } = useGridLines()
  const [showGridLines, setShowGridLines] = useState(false)

  // Danh sách feature cho bảng/map: chỉ có dữ liệu khi layer được bật
  const features = useMemo<IndoorFeatureItem[]>(
    () =>
      showGridLines
        ? geoJson.features.map((f, index) => ({
            feature: {
              ...f,
              id: String(f.id ?? index),
              properties: (f.properties ?? {}) as Record<string, any>,
            },
            layer: GRID_LINE_LAYER,
            index,
          }))
        : [],
    [geoJson, showGridLines]
  )

  // Khoảng đệm quanh bản đồ: 8px ở chế độ thường, 0 khi fullscreen
  const inset = isMapFullscreen ? 0 : 8

  // Đồng bộ state khi người dùng thoát fullscreen bằng phím Esc
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(document.fullscreenElement === mapCardRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Theo dõi chiều cao bảng (đổi khi thu gọn, đổi số dòng/trang...)
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setPanelHeight(Math.round(entry.contentRect.height))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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

  // Tắt layer thì bỏ chọn + đóng modal để không giữ feature không còn hiển thị
  const handleToggleGridLine = (visible: boolean) => {
    setShowGridLines(visible)
    if (!visible) {
      setSelectedFeature(null)
      setIsOpenSelectedFeatureModal(false)
    }
  }

  const handleSelectFeature = (item: IndoorFeatureItem) => {
    setSelectedFeature(item)
  }
  const handleClearSelection = () => setSelectedFeature(null)

  // Mở modal chi tiết. Modal render ở document.body nên phải thoát fullscreen trước
  const handleOpenDetailModal = async (item: IndoorFeatureItem | null) => {
    if (item) setSelectedFeature(item)
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.error('Không thể thoát toàn màn hình:', error)
      }
    }
    setIsOpenSelectedFeatureModal(true)
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
          <IndoorMap
            showGridLines={showGridLines}
            gridLineData={geoJson}
            features={features}
            selectedFeature={selectedFeature}
            onSelectFeature={handleSelectFeature}
            onClearSelection={handleClearSelection}
          />

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

          {/* BẢNG NỔI TRÊN KHUNG MAP (kiểu bảng thuộc tính QGIS) */}
          <div ref={panelRef} className="absolute right-1 bottom-1 left-1 z-1000">
            <IndoorTable
              features={features}
              loading={isLoading}
              selectedFeature={selectedFeature}
              onSelectFeature={handleSelectFeature}
              onOpenDetailModal={handleOpenDetailModal}
            />
          </div>
        </div>
      </main>

      {/* INDOOR ASIDE: chỉ là khung chứa, IndoorSideBar tự có card riêng nên không thêm viền/padding */}
      <aside className="outdoor_aside_map min-w-0 overflow-y-auto lg:col-span-1 lg:max-h-[min(85vh,720px)] justify-items-center">
        <IndoorSideBar
          isLoading={isLoading}
          error={error}
          gridLineCount={gridLines.length}
          isGridLineVisible={showGridLines}
          onToggleGridLine={handleToggleGridLine}
          onRefresh={reload}
        />
      </aside>

      {/* MODAL HIỂN THỊ THÔNG TIN CHI TIẾT */}
      <FeatureDetailModal
        isOpenSelectedFeatureModal={isOpenSelectedFeatureModal}
        onClose={() => setIsOpenSelectedFeatureModal(false)}
        data={selectedFeature}
      />
    </div>
  )
}
