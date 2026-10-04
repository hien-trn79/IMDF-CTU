import { ClockIcon, GlobeIcon, LocationEdit } from 'lucide-react'

interface ModalLocationProps {
  setIsCloseModal: (isClose: boolean) => void
}

export default function ModalLocation({ setIsCloseModal }: ModalLocationProps) {
  return (
    <div className="relative z-1000 mt-3 w-full rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:mt-4 sm:p-5 md:absolute md:right-8 md:top-8 md:mt-0 md:max-w-sm lg:right-10 lg:top-10">
      {/* Close button */}
      <button
        className="absolute top-3 right-3 rounded-full bg-white/90 p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 sm:top-4 sm:right-4"
        onClick={() => setIsCloseModal(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="font-bold text-xl leading-relaxed text-primary text-center sm:text-md">
        KẾT QUẢ TÌM KIẾM
      </div>
      <div className="map-photo mt-3 flex h-32 bg-amber-200 items-end overflow-hidden rounded-xl p-3 sm:mt-4 sm:h-40 sm:rounded-2xl sm:p-4">
        <div className="rounded-lg bg-white/90 px-2.5 py-1.5 font-k2d-medium text-[10px] text-slate-600 shadow-sm sm:px-3 sm:text-[11px]">
          Hình ảnh tìm thấy · 1/3
        </div>
      </div>
      <div className="mt-4 font-k2d-bold text-[17px] leading-tight text-slate-950 sm:mt-5 sm:text-[21px]">
        TÊN ĐỊA ĐIỂM TÌM THẤY
      </div>
      <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3 sm:text-md">
        <div className="flex items-center gap-3">
          <LocationEdit width={20} height={20} className="text-primary" />
          Khu II, Đ. 3 Tháng 2, Ninh Kiều, Cần Thơ, Việt Nam
        </div>
        <div className="flex items-center gap-3 ">
          <GlobeIcon width={20} height={20} className="text-primary" />
          <span className="text-[#218ac9]">https://www.ctu.edu.vn/</span>
        </div>
        <div className="flex items-center gap-3">
          <ClockIcon width={20} height={20} className="text-primary" />
          <span>5:00 - 21:00</span>
          <span className="ml-2 rounded-full bg-red-50 px-2 py-1 text-[10px] text-red-600">
            Đã đóng cửa
          </span>
        </div>
      </div>
    </div>
  )
}
