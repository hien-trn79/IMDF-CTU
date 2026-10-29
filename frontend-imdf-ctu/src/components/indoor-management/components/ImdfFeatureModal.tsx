import { useState, useEffect } from 'react'
import {
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
} from 'lucide-react'
import type {
  IMDFFeatureType,
  IMDFNormalizeResponse,
  IMDFProperties,
} from '../../../model/IMDF.model'

interface ImdfFeatureModalProps {
  isOpen: boolean
  isLoading: boolean
  normalizeData: IMDFNormalizeResponse | null
  error: string | null
  onClose: () => void
  onSave: (properties: IMDFProperties) => void
}

export default function ImdfFeatureModal({
  isOpen,
  isLoading,
  normalizeData,
  error,
  onClose,
  onSave,
}: ImdfFeatureModalProps) {
  const [name, setName] = useState('')
  const [altName, setAltName] = useState('')
  const [featureType, setFeatureType] = useState<IMDFFeatureType>('unit')
  const [levelId, setLevelId] = useState<number | string>(1)
  const [category, setCategory] = useState('classroom')
  const [restriction, setRestriction] = useState('public')

  useEffect(() => {
    if (normalizeData) {
      setName(normalizeData.properties?.name || '')
      setAltName(normalizeData.properties?.alt_name || '')
      setFeatureType((normalizeData.featureType as IMDFFeatureType) || 'unit')
      if (normalizeData.properties?.level_id) {
        setLevelId(normalizeData.properties.level_id)
      }
      if (normalizeData.properties?.category) {
        setCategory(normalizeData.properties.category)
      }
      if (normalizeData.properties?.restriction) {
        setRestriction(normalizeData.properties.restriction)
      }
    }
  }, [normalizeData])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!normalizeData) return

    const updatedProps: IMDFProperties = {
      ...normalizeData.properties,
      id: normalizeData.properties.id || String(Date.now()),
      name: name.trim() || `${featureType.toUpperCase()}_${Date.now().toString().slice(-4)}`,
      alt_name: altName.trim(),
      feature_type: featureType,
      level_id: Number(levelId) || 1,
      category,
      restriction,
      display_point: normalizeData.displayPoint?.coordinates,
      area_sqm: normalizeData.areaSqm,
      length_meters: normalizeData.lengthMeters,
      vertex_count: normalizeData.vertexCount,
      is_valid: true,
      normalized_at: new Date().toISOString(),
    }

    onSave(updatedProps)
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Chuẩn hóa IMDF & Thuộc tính đối tượng
              </h3>
              <p className="text-xs text-slate-500">
                Xác thực hình học PostGIS và gắn thẻ dữ liệu đặc tả chuẩn IMDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NỘI DUNG */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-700">
                Đang xử lý chuẩn hóa hình học trên Backend (ST_MakeValid)...
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Hệ thống đang kiểm tra tự cắt (self-intersection), đơn giản hóa topology và sinh Display Point.
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-sm">Lỗi chuẩn hóa hình học</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && normalizeData && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STATUS CARD TỪ BACKEND SPATIAL ENGINE */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  normalizeData.valid
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">{normalizeData.message}</p>
                    <p className="text-[11px] text-emerald-700">
                      Hình học: <strong>{normalizeData.geometryType}</strong> ({normalizeData.vertexCount} đỉnh)
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  {normalizeData.areaSqm > 0 && (
                    <span className="font-bold block text-emerald-800">
                      {normalizeData.areaSqm.toFixed(1)} m²
                    </span>
                  )}
                  {normalizeData.lengthMeters > 0 && (
                    <span className="text-[11px] text-emerald-600">
                      {normalizeData.lengthMeters.toFixed(1)} m
                    </span>
                  )}
                </div>
              </div>

              {/* TÂM HIỂN THỊ (DISPLAY POINT) */}
              {normalizeData.displayPoint && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-blue-600" /> Tâm hiển thị (display_point):
                  </span>
                  <span className="font-mono text-slate-800">
                    [{normalizeData.displayPoint.coordinates[0].toFixed(6)},{' '}
                    {normalizeData.displayPoint.coordinates[1].toFixed(6)}]
                  </span>
                </div>
              )}

              {/* FORM TRƯỜNG THUỘC TÍNH */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đối tượng (name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Phòng Lab AI 101"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên phụ / Mã phòng (alt_name)
                  </label>
                  <input
                    type="text"
                    value={altName}
                    onChange={(e) => setAltName(e.target.value)}
                    placeholder="VD: LAB-101"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại Feature IMDF
                  </label>
                  <select
                    value={featureType}
                    onChange={(e) => setFeatureType(e.target.value as IMDFFeatureType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="unit">Unit (Phòng / Không gian)</option>
                    <option value="building">Building (Tòa nhà)</option>
                    <option value="level">Level (Tầng)</option>
                    <option value="opening">Opening (Lối mở)</option>
                    <option value="door">Door (Cửa ra vào)</option>
                    <option value="fixture">Fixture (Nội thất/Thiết bị)</option>
                    <option value="footprint">Footprint (Chu vi móng)</option>
                    <option value="anchor">Anchor (Điểm định vị POI)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tầng / Mặt bằng (level_id)
                  </label>
                  <select
                    value={levelId}
                    onChange={(e) => setLevelId(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value={1}>Tầng 1 (Ground Floor)</option>
                    <option value={2}>Tầng 2 (Floor 2)</option>
                    <option value={3}>Tầng 3 (Floor 3)</option>
                    <option value={4}>Tầng 4 (Floor 4)</option>
                    <option value={5}>Tầng 5 (Floor 5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân loại chức năng (category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="classroom">Phòng học (classroom)</option>
                    <option value="lab">Phòng thực hành/Lab (lab)</option>
                    <option value="office">Văn phòng (office)</option>
                    <option value="conference">Phòng hội thảo (conference)</option>
                    <option value="corridor">Hành lang (corridor)</option>
                    <option value="restroom">Nhà vệ sinh (restroom)</option>
                    <option value="stairs">Cầu thang bộ (stairs)</option>
                    <option value="elevator">Thang máy (elevator)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hạn chế truy cập (restriction)
                  </label>
                  <select
                    value={restriction}
                    onChange={(e) => setRestriction(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="public">Công cộng (public)</option>
                    <option value="restricted">Hạn chế (restricted)</option>
                    <option value="employees_only">Dành riêng cho cán bộ (employees_only)</option>
                  </select>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận & Thêm đối tượng</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
