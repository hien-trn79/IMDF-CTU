import {
  ChevronDown,
  ChevronUp,
  ClockIcon,
  Copy,
  Check,
  Footprints,
  GlobeIcon,
  Loader2,
  GraduationCap,
  Layers,
  MapPin,
  Navigation,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useMapNavigation } from '../../context/MapNavigationContext'

interface ModalLocationProps {
  setIsCloseModal: (isClose: boolean) => void
  onFitRoute?: () => void
}

export default function ModalLocation({ setIsCloseModal, onFitRoute }: ModalLocationProps) {
  const { selectedDestination, routeData, isRouting, clearRoute, setShowDirectionsModal } =
    useMapNavigation()

  const [isCopied, setIsCopied] = useState(false)
  const [showSteps, setShowSteps] = useState(false)

  // Nếu không có địa điểm nào được chọn, hiển thị mẫu hoặc mặc định
  const dest = selectedDestination
  const isRoom = dest?.category === 'room'
  const roomCode = dest?.roomCode

  const handleCopyCode = () => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="relative z-1000 mt-3 box-border flex max-h-[calc(100dvh-1rem)] min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:mt-4 sm:max-h-[calc(100dvh-2rem)] sm:p-5 md:absolute md:right-8 md:top-4 md:bottom-4 md:mt-0 md:max-h-none md:max-w-sm lg:right-10 lg:top-6 lg:bottom-6 animate-in fade-in-50 zoom-in-95 duration-200">
      {/* Nút đóng Modal */}
      <button
        className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-gray-700 sm:top-4 sm:right-4 cursor-pointer"
        onClick={() => setIsCloseModal(true)}
        title="Đóng bảng thông tin"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        {/* TIÊU ĐỀ */}
        <div className="font-bold text-lg leading-relaxed text-primary text-center sm:text-md uppercase tracking-wide flex items-center justify-center gap-1.5">
          <Sparkles size={16} className="text-amber-500" />
          <span>{isRoom ? 'THÔNG TIN PHÒNG HỌC' : 'KẾT QUẢ TÌM KIẾM'}</span>
        </div>

        {/* BANNER HÌNH ẢNH / MÃ PHÒNG */}
        <div className="map-photo mt-3 relative flex h-32 bg-linear-to-br from-sky-400 via-indigo-500 to-blue-700 items-end justify-between overflow-hidden rounded-xl p-3 sm:mt-4 sm:h-36 sm:rounded-2xl sm:p-4 shadow-inner">
          {/* Nền đồ họa hoặc badge */}
          <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px]" />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-1.5 text-white/90 text-xs font-semibold">
              {isRoom ? <GraduationCap size={15} /> : <Layers size={15} />}
              <span>
                {isRoom
                  ? 'Phòng học · Giảng đường'
                  : dest?.category === 'building'
                    ? 'Toà nhà'
                    : 'Khu vực'}
              </span>
            </div>

            {roomCode && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-md px-2.5 py-1 text-white border border-white/30">
                <span className="text-[11px] font-medium">Mã phòng:</span>
                <strong className="text-sm font-extrabold tracking-wider">{roomCode}</strong>
              </div>
            )}
          </div>

          <div className="relative z-10 rounded-lg bg-white/90 px-2.5 py-1 font-k2d-medium text-[11px] text-slate-700 shadow-sm">
            {dest?.level !== undefined ? `Tầng ${dest.level}` : 'Khuôn viên CTU'}
          </div>
        </div>

        {/* TÊN ĐỊA ĐIỂM TÌM THẤY */}
        <div className="mt-3.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-k2d-bold text-[18px] leading-tight text-slate-950 sm:text-[20px]">
              {dest ? dest.title : 'TÊN ĐỊA ĐIỂM TÌM THẤY'}
            </h2>
            {dest?.subtitle && <p className="text-xs text-slate-500 mt-0.5">{dest.subtitle}</p>}
          </div>

          {/* Nút sao chép mã phòng nếu có */}
          {roomCode && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition shrink-0 cursor-pointer"
              title="Sao chép mã phòng"
            >
              {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{isCopied ? 'Đã chép' : roomCode}</span>
            </button>
          )}
        </div>

        {/* THÔNG TIN CHI TIẾT ĐỊA ĐIỂM HIỆN CÓ */}
        <div className="mt-3 space-y-2 text-xs sm:text-sm text-slate-700 border-t border-slate-100 pt-3">
          {/* Địa chỉ */}
          <div className="flex items-start gap-2.5">
            <MapPin className="text-primary shrink-0 mt-0.5" size={17} />
            <span className="leading-snug">
              {dest?.address || 'Khu II, Đ. 3 Tháng 2, Ninh Kiều, Cần Thơ, Việt Nam'}
            </span>
          </div>

          {/* Toà nhà / Vị trí */}
          {dest?.buildingName && (
            <div className="flex items-center gap-2.5">
              <Layers className="text-primary shrink-0" size={17} />
              <span>
                Toà nhà: <strong>{dest.buildingName}</strong>
              </span>
            </div>
          )}

          {/* Cổng vào chính ưu tiên của đường nội tuyến */}
          {isRoom && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 p-2 text-xs">
              <span className="text-sm shrink-0 mt-0.5">🚪</span>
              <div className="min-w-0">
                <span className="font-bold text-amber-900 block">
                  Cổng vào chính (Điểm vào nội tuyến)
                </span>
                <span className="text-[11px] text-amber-700 block">
                  Bắt đầu đường nội tuyến từ cổng chính Khoa CNTT&TT
                </span>
                <span
                  className="font-mono text-[9px] text-slate-400 block truncate"
                  title="0000000001405A71363E2F0AAE40240FC5A6800F3F"
                >
                  WKB: 0000000001405A71363E2F0AAE40240FC5A6800F3F
                </span>
              </div>
            </div>
          )}

          {/* Website */}
          <div className="flex items-center gap-2.5">
            <GlobeIcon className="text-primary shrink-0" size={17} />
            <a
              href="https://www.ctu.edu.vn/"
              target="_blank"
              rel="noreferrer"
              className="text-[#218ac9] hover:underline"
            >
              https://www.ctu.edu.vn/
            </a>
          </div>

          {/* Thời gian mở cửa */}
          <div className="flex items-center gap-2.5">
            <ClockIcon className="text-primary shrink-0" size={17} />
            <span>7:00 - 21:00</span>
            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              Đang mở cửa
            </span>
          </div>
        </div>

        {/* THÔNG TIN LỘ TRÌNH ĐƯỜNG ĐI (KHI ĐÃ TÌM ĐƯỜNG) */}
        {routeData && (
          <div className="mt-3.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-blue-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Footprints size={17} className="text-blue-600" />
                <span>{routeData.distanceText}</span>
                <span className="text-blue-400">·</span>
                <span className="text-emerald-700 font-semibold">{routeData.durationText}</span>
              </div>

              <button
                onClick={() => setShowSteps((prev) => !prev)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>{showSteps ? 'Thu gọn' : 'Chi tiết'}</span>
                {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <p className="text-[11px] text-blue-700/80 mt-1">
              Đường đi bộ theo chỉ dẫn Google Maps từ vị trí của bạn đến đích.
            </p>

            {/* Các bước rẽ / di chuyển */}
            {showSteps && routeData.steps && routeData.steps.length > 0 && (
              <div className="mt-2.5 max-h-40 overflow-y-auto space-y-1.5 border-t border-blue-200/60 pt-2 text-xs text-slate-700 pr-1">
                {routeData.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 leading-tight">{step.instruction}</p>
                      {step.distance > 0 && (
                        <p className="text-[11px] text-slate-500">{step.distance} m</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CÁC NÚT THAO TÁC / CHỈ ĐƯỜNG */}
      <div className="shrink-0 border-t border-slate-100 pt-3 mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowDirectionsModal(true)}
          disabled={isRouting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-sky-600 py-2.5 px-4 font-k2d-bold text-sm text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-sky-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-70"
        >
          <Navigation size={16} className="fill-current" />
          {isRouting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang mở tìm đường...</span>
            </>
          ) : (
            <span>{routeData ? 'Cập nhật đường đi' : 'Bắt đầu chỉ đường'}</span>
          )}
        </button>

        {routeData && (
          <div className="flex gap-2">
            {onFitRoute && (
              <button
                type="button"
                onClick={onFitRoute}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                title="Căn giữa toàn bộ lộ trình"
              >
                <span>Toàn cảnh lộ trình</span>
              </button>
            )}

            <button
              type="button"
              onClick={clearRoute}
              className="flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50/60 py-2 px-3 text-xs font-semibold text-red-600 hover:bg-red-100/60 transition cursor-pointer"
              title="Xoá đường đi khỏi bản đồ"
            >
              <RotateCcw size={13} />
              <span>Xoá đường</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
