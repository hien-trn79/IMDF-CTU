import { useState, useEffect } from 'react'
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'
import type { PublishLayerFormData, SysPublishedLayer } from '../../../model/IMDF.model'
import { imdfService } from '../../../services/imdfService'

interface PublishLayerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newLayer: SysPublishedLayer) => void
  currentLayerName?: string
  currentLevelId?: number
  currentFeatureCount?: number
}

export default function PublishLayerModal({
  isOpen,
  onClose,
  onSuccess,
  currentLayerName = 'unit_level_1',
  currentLevelId = 1,
  currentFeatureCount = 0,
}: PublishLayerModalProps) {
  const [tableName, setTableName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [workspace, setWorkspace] = useState('imdf_ctu')
  const [description, setDescription] = useState('')
  const [srid, setSrid] = useState(4326)
  const [styleName, setStyleName] = useState('indoor_unit_polygon')
  const [serviceTypes, setServiceTypes] = useState<('WMS' | 'WFS' | 'MVT')[]>([
    'WMS',
    'WFS',
    'MVT',
  ])

  const [availableStyles, setAvailableStyles] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [publishResult, setPublishResult] = useState<SysPublishedLayer | null>(null)
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTableName(currentLayerName)
      setDisplayName(`Layer ${currentLayerName.replace(/_/g, ' ').toUpperCase()}`)
      setDescription(`Lớp dữ liệu không gian Indoor Tầng ${currentLevelId} với ${currentFeatureCount} đối tượng`)
      setSubmitError(null)
      setPublishResult(null)

      // Lấy danh sách styles SLD từ backend
      imdfService
        .getAvailableStyles()
        .then((styles) => setAvailableStyles(styles))
        .catch(() =>
          setAvailableStyles([
            'indoor_unit_polygon',
            'indoor_corridor_fill',
            'opening_door_line',
            'fixture_marker_point',
            'default_polygon',
          ])
        )
    }
  }, [isOpen, currentLayerName, currentLevelId, currentFeatureCount])

  if (!isOpen) return null

  const handleToggleService = (type: 'WMS' | 'WFS' | 'MVT') => {
    setServiceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(key)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (serviceTypes.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất một loại dịch vụ bản đồ (WMS, WFS hoặc MVT)')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    const formData: PublishLayerFormData = {
      tableName: tableName.trim(),
      displayName: displayName.trim(),
      workspace: workspace.trim(),
      description: description.trim(),
      srid,
      styleName,
      serviceTypes,
      levelId: currentLevelId,
    }

    try {
      const result = await imdfService.publishLayer(formData)
      setPublishResult(result)
      onSuccess(result)
    } catch (err: any) {
      setSubmitError(err?.message || 'Không thể xuất bản layer lên GeoServer. Vui lòng kiểm tra cấu hình GeoServer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Xuất bản Layer lên GeoServer (Publish Layer)
              </h3>
              <p className="text-xs text-slate-500">
                Cấu hình OGC Web Services (WMS / WFS / Vector Tiles) cho dữ liệu bản đồ Indoor
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

        {/* NỘI DUNG FORM */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {submitError && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-sm">Lỗi xuất bản Layer</p>
                <p className="mt-1">{submitError}</p>
              </div>
            </div>
          )}

          {/* KẾT QUẢ XUẤT BẢN THÀNH CÔNG */}
          {publishResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Xuất bản thành công lên GeoServer!</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Layer <strong>{publishResult.workspace}:{publishResult.layerName}</strong> đã được
                    kích hoạt thành công và lưu vào danh mục bản đồ hệ thống.
                  </p>
                </div>
              </div>

              {/* ENDPOINT URLS */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Các Endpoint dịch vụ đã cấp phát:
                </label>

                {publishResult.wmsUrl && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-blue-700 block">WMS (Web Map Service):</span>
                      <code className="text-slate-600 text-[11px] break-all">{publishResult.wmsUrl}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(publishResult.wmsUrl!, 'wms')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition shrink-0"
                    >
                      {copiedEndpoint === 'wms' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {publishResult.wfsUrl && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-700 block">WFS (Web Feature Service / GeoJSON):</span>
                      <code className="text-slate-600 text-[11px] break-all">{publishResult.wfsUrl}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(publishResult.wfsUrl!, 'wfs')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition shrink-0"
                    >
                      {copiedEndpoint === 'wfs' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {publishResult.mvtUrl && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-purple-700 block">Vector Tile (MVT / PBF):</span>
                      <code className="text-slate-600 text-[11px] break-all">{publishResult.mvtUrl}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(publishResult.mvtUrl!, 'mvt')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition shrink-0"
                    >
                      {copiedEndpoint === 'mvt' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow transition"
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* TÊN LAYER & WORKSPACE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Layer (Table / Layer Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="VD: unit_level_1"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Workspace GeoServer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={workspace}
                    onChange={(e) => setWorkspace(e.target.value)}
                    placeholder="VD: imdf_ctu"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên hiển thị (Display Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="VD: Không gian phòng học Tầng 1"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* MÔ TẢ LAYER */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả Layer (Description)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả phạm vi, chức năng của lớp dữ liệu Indoor..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* HỆ TỌA ĐỘ / SRS & STYLE SLD */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hệ tọa độ / SRS
                  </label>
                  <select
                    value={srid}
                    onChange={(e) => setSrid(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value={4326}>EPSG:4326 (WGS 84 - Chuẩn IMDF GPS)</option>
                    <option value={3857}>EPSG:3857 (WGS 84 / Pseudo-Mercator)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn Style / SLD hiển thị
                  </label>
                  <select
                    value={styleName}
                    onChange={(e) => setStyleName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {availableStyles.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LOẠI DỊCH VỤ XUẤT BẢN MUỐN CẤP */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Loại dịch vụ xuất bản muốn cấp:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      serviceTypes.includes('WMS')
                        ? 'bg-blue-50/80 border-blue-400 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={serviceTypes.includes('WMS')}
                      onChange={() => handleToggleService('WMS')}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-xs block">WMS</span>
                      <span className="text-[10px] text-slate-500">Tile hình ảnh</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      serviceTypes.includes('WFS')
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={serviceTypes.includes('WFS')}
                      onChange={() => handleToggleService('WFS')}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-xs block">WFS</span>
                      <span className="text-[10px] text-slate-500">Vector GeoJSON</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      serviceTypes.includes('MVT')
                        ? 'bg-purple-50/80 border-purple-400 text-purple-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={serviceTypes.includes('MVT')}
                      onChange={() => handleToggleService('MVT')}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-bold text-xs block">Vector Tiles</span>
                      <span className="text-[10px] text-slate-500">MVT PBF siêu tốc</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang kích hoạt GeoServer...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Xác nhận Publish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
