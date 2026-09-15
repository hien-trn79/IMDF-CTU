import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, MapPin, Layers, Hash, Building2, Copy, Check, Code2, AlignLeft } from 'lucide-react'
import type { BuildingType } from '../model/Building.model'

interface CustomModalProps {
  building: BuildingType | null
  isOpen: boolean
  onClose: () => void
}

export default function CustomModal({ building, isOpen, onClose }: CustomModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrollBodyRef = useRef<HTMLDivElement>(null)

  // Trạng thái cho khối GeoJSON: đã copy chưa, đang xem dạng đẹp hay thu gọn
  const [copied, setCopied] = useState(false)
  const [isPretty, setIsPretty] = useState(true)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)

    const originalOverflow = document.body.style.overflow
    const originalOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'contain'

    const overlayEl = overlayRef.current
    const scrollEl = scrollBodyRef.current

    const blockAll = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleScrollAreaTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
        return
      }
      e.stopPropagation()
    }

    const handleScrollAreaWheel = (e: WheelEvent) => {
      if (!scrollEl) return
      const { scrollTop, scrollHeight, clientHeight } = scrollEl
      const atTop = scrollTop <= 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1
      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        e.preventDefault()
      }
      e.stopPropagation()
    }

    overlayEl?.addEventListener('wheel', blockAll, { passive: false })
    overlayEl?.addEventListener('touchmove', blockAll, { passive: false })
    overlayEl?.addEventListener('gesturestart', blockAll as EventListener, { passive: false })
    overlayEl?.addEventListener('gesturechange', blockAll as EventListener, { passive: false })

    scrollEl?.addEventListener('wheel', handleScrollAreaWheel, { passive: false })
    scrollEl?.addEventListener('touchmove', handleScrollAreaTouch, { passive: false })

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = originalOverflow
      document.body.style.overscrollBehavior = originalOverscroll

      overlayEl?.removeEventListener('wheel', blockAll)
      overlayEl?.removeEventListener('touchmove', blockAll)
      overlayEl?.removeEventListener('gesturestart', blockAll as EventListener)
      overlayEl?.removeEventListener('gesturechange', blockAll as EventListener)

      scrollEl?.removeEventListener('wheel', handleScrollAreaWheel)
      scrollEl?.removeEventListener('touchmove', handleScrollAreaTouch)
    }
  }, [isOpen, onClose])

  // Reset trạng thái copy/format mỗi khi mở lại modal cho tòa nhà khác
  useEffect(() => {
    setCopied(false)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
  }, [building?.id])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  if (!isOpen || !building) return null

  const { id, geometry, properties } = building
  const displayName = properties?.['name:vi'] || properties?.name || 'Chưa có thông tin'
  const coordinatesText = JSON.stringify(geometry?.coordinates ?? [], null, 2)

  // Toàn bộ feature ở định dạng chuẩn GeoJSON (không chỉ geometry)
  const geojsonFeature = {
    type: 'Feature',
    id: id ?? null,
    geometry: geometry ?? null,
    properties: properties ?? {},
  }

  const geojsonText = isPretty
    ? JSON.stringify(geojsonFeature, null, 2)
    : JSON.stringify(geojsonFeature)

  const handleCopyGeojson = async () => {
    try {
      await navigator.clipboard.writeText(geojsonText)
    } catch {
      // Fallback cho môi trường không hỗ trợ Clipboard API (http, trình duyệt cũ)
      const textarea = document.createElement('textarea')
      textarea.value = geojsonText
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
      } finally {
        document.body.removeChild(textarea)
      }
    }
    setCopied(true)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ touchAction: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="building-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full sm:max-w-md md:max-w-lg bg-white/95 backdrop-blur-xl
                   rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.35)]
                   ring-1 ring-black/5
                   max-h-[92dvh] sm:max-h-[85vh] overflow-hidden
                   flex flex-col
                   animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        style={{ touchAction: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 sm:hidden shrink-0">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-3 sm:pt-5 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="shrink-0 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 p-2 sm:p-2.5 shadow-lg shadow-sky-500/20">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2
                id="building-modal-title"
                className="text-sm sm:text-lg font-bold text-gray-900 truncate"
              >
                Thông tin tòa nhà
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">{displayName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 sm:p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition-all"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div
          ref={scrollBodyRef}
          className="overflow-y-auto overscroll-contain px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 sm:space-y-4"
          style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
        >
          <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-100 px-3.5 sm:px-4 py-3 sm:py-3.5">
            <p className="text-[10px] sm:text-[11px] font-semibold text-sky-600 uppercase tracking-wider mb-1">
              Tên công trình
            </p>
            <p className="text-base sm:text-lg font-bold text-gray-900 break-words leading-snug">
              {displayName}
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <InfoField
              icon={<Hash className="w-3.5 h-3.5" />}
              label="ID"
              value={id || 'Chưa có thông tin'}
            />
            <InfoField
              icon={<Building2 className="w-3.5 h-3.5" />}
              label="Loại công trình"
              value={properties?.building || 'Chưa có thông tin'}
            />
            <InfoField
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Tên (mặc định)"
              value={properties?.name || 'Chưa có thông tin'}
            />
            <InfoField
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Tên (Tiếng Việt)"
              value={properties?.['name:vi'] || 'Chưa có thông tin'}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-gray-400 mb-2">
              <Layers className="w-3.5 h-3.5" />
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">
                Geometry
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-3 sm:p-3.5 space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Type
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  {geometry?.type || 'Chưa có thông tin'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Coordinates
                </p>
                <pre
                  className="text-xs text-gray-600 bg-white rounded-xl border border-gray-200 p-2.5 overflow-x-auto max-h-28 sm:max-h-32 overflow-y-auto overscroll-contain whitespace-pre-wrap break-all font-mono"
                  style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                >
                  {coordinatesText}
                </pre>
              </div>
            </div>
          </div>

          {/* Khối GeoJSON đầy đủ - toàn bộ feature, kèm sao chép và định dạng */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Code2 className="w-3.5 h-3.5" />
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">
                  GeoJSON đầy đủ
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPretty((prev) => !prev)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 hover:border-sky-300 hover:text-sky-600 active:scale-95 transition-all"
                  aria-label={isPretty ? 'Chuyển sang dạng thu gọn' : 'Chuyển sang dạng đẹp'}
                  title={isPretty ? 'Xem dạng thu gọn' : 'Xem dạng đẹp'}
                >
                  <AlignLeft className="w-3 h-3" />
                  {isPretty ? 'Format' : 'Thu gọn'}
                </button>

                <button
                  type="button"
                  onClick={handleCopyGeojson}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium active:scale-95 transition-all ${
                    copied
                      ? 'border-green-200 bg-green-50 text-green-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-sky-300 hover:text-sky-600'
                  }`}
                  aria-label="Sao chép GeoJSON"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-3 sm:p-3.5">
              <pre
                className="text-[11px] text-gray-200 overflow-x-auto max-h-48 overflow-y-auto overscroll-contain whitespace-pre-wrap break-all font-mono leading-relaxed"
                style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
              >
                {geojsonText}
              </pre>
            </div>
          </div>
        </div>

        <div
          className="border-t border-gray-100 px-4 sm:px-5 py-3 sm:py-3.5 flex justify-end bg-white/80 shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 active:scale-[0.98] shadow-sm shadow-sky-600/20 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 px-3 sm:px-3.5 py-2 sm:py-2.5 hover:border-sky-200 transition-colors">
      <div className="flex items-center gap-1.5 text-sky-500 mb-1">
        {icon}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
    </div>
  )
}
