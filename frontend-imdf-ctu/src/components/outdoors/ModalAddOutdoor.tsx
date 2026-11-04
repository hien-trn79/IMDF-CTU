import { Modal } from 'antd'
import { useLevel } from '../../context/LevelContext'
import { useUser } from '../../context/UserContext'
import { useEffect, useState, type ReactNode } from 'react'
import { calcPolylineLengthMeters, formatLength } from '../../utils/wkbUtils'
import type { UnitCategoriesResponse, UnitRequestPayload } from '../../model/imdf models/Unit.model'
import type { RestrictionCategoryResponse } from '../../model/imdf models/Restriction.model'
import type { FeatureResponse } from '../../model/imdf models/Feature.model'
import { unitService } from '../../services/unitService'
import { authHeaders } from '../../services/authHeaders'
import type { AmenityCategoryResponse } from '../../model/imdf models/Amenity.model'

interface ModalAddOutdoorProps {
  onClose: () => void
  isOpen: boolean
  coordinates: [number, number][]
  drawing: boolean
  snapEnabled: boolean
  onDrawingChange: (drawing: boolean) => void
  onClearCoordinates: () => void
  onSnapChange: (snapEnabled: boolean) => void
  onCreated: () => void
}

const BASE_URL = 'http://localhost:8081/api'

/* ---------- Style dùng chung cho các ô nhập / chọn ---------- */
const controlClass =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 ' +
  'placeholder:text-slate-400 shadow-xs outline-none transition ' +
  'hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'

const selectClass = `${controlClass} appearance-none pr-8`

/* ---------- Nhãn nằm phía trên control ---------- */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

/* Select có mũi tên tùy chỉnh để đồng nhất giao diện */
function SelectBox({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}

export default function ModalAddOutdoor({
  onClose,
  isOpen,
  coordinates,
  drawing,
  snapEnabled,
  onDrawingChange,
  onClearCoordinates,
  onSnapChange,
  onCreated,
}: ModalAddOutdoorProps) {
  const { selectedLevelId, selectedTable, setSelectedTable, unitGeoJson } = useLevel()

  const [unitCategories, setUnitCategories] = useState<UnitCategoriesResponse[]>([])
  const [restrictionCategories, setRestrictionCategories] = useState<RestrictionCategoryResponse[]>(
    []
  )
  const [features, setFeatures] = useState<FeatureResponse[]>([])
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategoryResponse[]>([])

  const [unitDataPayload, setUnitDataPayload] = useState<UnitRequestPayload | null>({
    unitName: '',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [],
    },
    displayPoint: {
      type: 'Point',
      coordinates: [0, 0],
    },
    featureId: 0,
    levelId: Number(selectedLevelId ?? 0),
    unitCategoryId: 0,
    restrictionCategoryId: 0,
  })

  const tableOptions = [
    { value: 'unit', label: 'Unit' },
    { value: 'anchors', label: 'Anchors' },
    { value: 'amenities', label: 'Amenities' },
  ]

  const { token } = useUser()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anchorData, setAnchorData] = useState({ anchorName: '', featureId: 0, unitId: 0 })
  const [amenityData, setAmenityData] = useState({
    amenityName: '',
    phone: '',
    website: '',
    hours: '',
    amenityCategoryId: 0,
    featureId: 0,
    unitId: 0,
  })

  // Fetch dữ liệu cho các khóa ngoại
  useEffect(() => {
    const fetchUnitCategories = async () => {
      try {
        const response = await fetch(`${BASE_URL}/unit-categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUnitCategories(data)
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh mục Unit:', error)
      }
    }

    const fetchRestrictionCategories = async () => {
      try {
        const response = await fetch(`${BASE_URL}/restriction-categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setRestrictionCategories(data)
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh mục Restriction:', error)
      }
    }

    const fetchFeatures = async () => {
      try {
        const response = await fetch(`${BASE_URL}/features`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setFeatures(data)
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh mục Features:', error)
      }
    }

    const fetchAmenityCategories = async () => {
      try {
        const response = await fetch(`${BASE_URL}/amenity-categories`, {
          headers: authHeaders(token ?? ''),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        setAmenityCategories((await response.json()) as AmenityCategoryResponse[])
      } catch (loadError) {
        console.error('Lỗi khi lấy danh mục Amenity:', loadError)
      }
    }

    fetchUnitCategories()
    fetchRestrictionCategories()
    fetchFeatures()
    fetchAmenityCategories()

    return () => {
      setUnitCategories([])
      setRestrictionCategories([])
      setFeatures([])
      setAmenityCategories([])
    }
  }, [token])

  const handleAddOutdoor = async () => {
    setError(null)
    const levelId = Number(selectedLevelId ?? 0)
    if (!levelId) return setError('Vui lòng chọn tầng trước khi lưu.')
    if (coordinates.length === 0) return setError('Vui lòng vẽ geometry trên bản đồ.')
    const first = coordinates[0]
    try {
      setSaving(true)
      if (selectedTable === 'unit') {
        if (coordinates.length < 3) return setError('Unit cần ít nhất 3 điểm.')
        if (
          !unitDataPayload?.unitName.trim() ||
          !unitDataPayload.unitCategoryId ||
          !unitDataPayload.restrictionCategoryId
        ) {
          return setError('Vui lòng nhập tên Unit và chọn đầy đủ category.')
        }
        const ring = [...coordinates, first]
        await unitService.create(
          {
            unitName: unitDataPayload?.unitName.trim() ?? '',
            geometry: { type: 'MultiPolygon', coordinates: [[ring]] },
            displayPoint: { type: 'Point', coordinates: first },
            featureId: unitDataPayload?.featureId || null,
            levelId,
            unitCategoryId: unitDataPayload?.unitCategoryId ?? 0,
            restrictionCategoryId: unitDataPayload?.restrictionCategoryId ?? 0,
          },
          token ?? undefined
        )
      } else if (selectedTable === 'anchors') {
        if (!anchorData.anchorName.trim() || !anchorData.featureId || !anchorData.unitId) {
          return setError('Vui lòng nhập đầy đủ thông tin Anchor.')
        }

        const anchorResponse = await fetch(`${BASE_URL}/anchors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            anchorName: anchorData.anchorName.trim(),
            geometry: { type: 'Point', coordinates: first },
            featureId: anchorData.featureId,
            unitId: anchorData.unitId,
          }),
        })
        if (!anchorResponse.ok)
          throw new Error(`Tạo Anchor thất bại (HTTP ${anchorResponse.status}).`)

        const data = await anchorResponse.json()
        console.log('Anchor created:', data)
      } else {
        if (
          !amenityData.amenityName.trim() ||
          !amenityData.featureId ||
          !amenityData.amenityCategoryId
        ) {
          return setError('Vui lòng nhập đầy đủ thông tin Amenity.')
        }

        const amenityResponse = await fetch(`${BASE_URL}/amenities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amenityName: amenityData.amenityName.trim(),
            geometry: { type: 'Point', coordinates: first },
            phone: amenityData.phone,
            website: amenityData.website,
            hours: amenityData.hours || null,
            amenityCategoryId: amenityData.amenityCategoryId,
            featureId: amenityData.featureId,
            unitId: amenityData.unitId || null,
            levelId,
          }),
        })

        if (!amenityResponse.ok)
          throw new Error(`Tạo Amenity thất bại (HTTP ${amenityResponse.status}).`)

        const data = await amenityResponse.json()
        console.log('Amenity created:', data)
      }
      onCreated()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu đối tượng.')
    } finally {
      setSaving(false)
    }
  }

  const lengthMeters = coordinates.length >= 2 ? calcPolylineLengthMeters(coordinates) : 0

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="text-emerald-600 font-bold">✏️</span>
          <span>Thêm đối tượng cho bảng {selectedTable}</span>
        </div>
      }
      open={isOpen}
      onOk={handleAddOutdoor}
      okText={saving ? 'Đang chuẩn hóa & Lưu...' : 'Lưu đường đi'}
      cancelText="Hủy"
      confirmLoading={saving}
      mask={false}
      onCancel={onClose}
      wrapClassName="!pointer-events-none"
      modalRender={(modal) => <div className="pointer-events-auto">{modal}</div>}
      style={{
        top: 20,
        marginRight: 20,
        marginLeft: 'auto',
        width: 420,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div className="space-y-3 pt-1">
        <div className="rounded-lg bg-sky-50/80 p-2.5 border border-sky-100 text-xs text-sky-900 leading-relaxed">
          <p className="font-semibold flex items-center gap-1 text-sky-800 mb-1">
            💡 QGIS Snapping & Chuẩn hóa Topology
          </p>

          <span>
            Bật chế độ vẽ và click lên bản đồ. Điểm vẽ sẽ tự động{' '}
            <strong>hút vào node, đỉnh hoặc đường gần nhất</strong> nếu có. Sau khi vẽ xong, hệ
            thống sẽ tự động chuẩn hóa và lưu vào bảng {selectedTable}. <br />
          </span>
        </div>

        {/* Các nút chức năng */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const nextDrawing = !drawing
              onDrawingChange(nextDrawing)
              if (!nextDrawing) onClearCoordinates()
            }}
            className={`rounded-lg px-3 py-1 5 text-xs font-semibold flex items-center transition-all cursor-pointer
            ${
              drawing
                ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700'
                : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
            }
            `}
          >
            <span>{drawing ? '⏹ Dừng vẽ' : '✏️ Bắt đầu vẽ'}</span>
          </button>

          {/* SNAP Default on */}
          <button
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              snapEnabled
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => onSnapChange(!snapEnabled)}
          >
            🧲 Hút điểm (Snap): {snapEnabled ? 'BẬT' : 'TẮT'}
          </button>

          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            onClick={() => {
              onDrawingChange(false)
              onClearCoordinates()
            }}
            disabled={coordinates.length === 0}
          >
            🗑️ Xóa đường
          </button>
        </div>

        {/* Summary sau khi vẽ */}
        <div className="rounded-lg bg-slate-100/80 px-3 py-2 text-xs flex justify-between items-center text-slate-700">
          <span>
            Số điểm đã chọn: <strong>{coordinates.length}</strong>
          </span>
          <span>
            Độ dài: <strong className="text-emerald-700">{formatLength(lengthMeters)}</strong>
          </span>
        </div>

        {/* ===== Từ đây trở xuống: phần ô nhập / chọn đã được thiết kế lại ===== */}
        <hr className="border-slate-100" />

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Thông tin đối tượng</h3>

          <Field label="Bảng">
            <SelectBox>
              <select
                value={selectedTable}
                onChange={(e) => {
                  setSelectedTable(e.target.value)
                  onDrawingChange(false)
                  onClearCoordinates()
                }}
                className={selectClass}
              >
                {tableOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SelectBox>
          </Field>

          {selectedTable === 'unit' && (
            <>
              <Field label="Tên Unit">
                <input
                  className={controlClass}
                  value={unitDataPayload?.unitName ?? ''}
                  onChange={(e) =>
                    setUnitDataPayload((prev) => prev && { ...prev, unitName: e.target.value })
                  }
                />
              </Field>
              <Field label="Feature">
                <SelectBox>
                  <select
                    className={selectClass}
                    value={unitDataPayload?.featureId ?? 0}
                    onChange={(e) =>
                      setUnitDataPayload(
                        (prev) => prev && { ...prev, featureId: Number(e.target.value) || 0 }
                      )
                    }
                  >
                    <option value={0}>Chọn Feature</option>
                    {features.map((feature) => (
                      <option key={feature.id} value={feature.id}>
                        {feature.id} - {feature.featureType}
                      </option>
                    ))}
                  </select>
                </SelectBox>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Unit Category">
                  <SelectBox>
                    <select
                      className={selectClass}
                      value={unitDataPayload?.unitCategoryId ?? 0}
                      onChange={(e) =>
                        setUnitDataPayload(
                          (prev) => prev && { ...prev, unitCategoryId: Number(e.target.value) || 0 }
                        )
                      }
                    >
                      <option value={0}>Chọn Unit Category</option>
                      {unitCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.unitCategoryName}
                        </option>
                      ))}
                    </select>
                  </SelectBox>
                </Field>
                <Field label="Restriction Category">
                  <SelectBox>
                    <select
                      className={selectClass}
                      value={unitDataPayload?.restrictionCategoryId ?? 0}
                      onChange={(e) =>
                        setUnitDataPayload(
                          (prev) =>
                            prev && { ...prev, restrictionCategoryId: Number(e.target.value) || 0 }
                        )
                      }
                    >
                      <option value={0}>Chọn Restriction Category</option>
                      {restrictionCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.restrictionCateName}
                        </option>
                      ))}
                    </select>
                  </SelectBox>
                </Field>
              </div>
            </>
          )}

          {selectedTable === 'anchors' && (
            <>
              <Field label="Tên Anchor">
                <input
                  className={controlClass}
                  value={anchorData.anchorName}
                  onChange={(e) =>
                    setAnchorData((prev) => ({ ...prev, anchorName: e.target.value }))
                  }
                />
              </Field>
              <Field label="Feature">
                <SelectBox>
                  <select
                    className={selectClass}
                    value={anchorData.featureId}
                    onChange={(e) =>
                      setAnchorData((prev) => ({ ...prev, featureId: Number(e.target.value) || 0 }))
                    }
                  >
                    <option value={0}>Chọn Feature</option>
                    {features.map((feature) => (
                      <option key={feature.id} value={feature.id}>
                        {feature.id} - {feature.featureType}
                      </option>
                    ))}
                  </select>
                </SelectBox>
              </Field>
              <Field label="Unit ID">
                <SelectBox>
                  <select
                    className={selectClass}
                    value={anchorData.unitId || ''}
                    onChange={(e) =>
                      setAnchorData((prev) => ({ ...prev, unitId: Number(e.target.value) || 0 }))
                    }
                  >
                    <option value="">Chọn phòng học</option>
                    {(unitGeoJson?.features ?? []).map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.id} - {unit.properties.unitName}
                      </option>
                    ))}
                  </select>
                </SelectBox>
              </Field>
            </>
          )}

          {selectedTable === 'amenities' && (
            <>
              <Field label="Tên Amenity">
                <input
                  className={controlClass}
                  value={amenityData.amenityName}
                  onChange={(e) =>
                    setAmenityData((prev) => ({ ...prev, amenityName: e.target.value }))
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <input
                    className={controlClass}
                    value={amenityData.phone}
                    onChange={(e) => setAmenityData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </Field>
                <Field label="Website">
                  <input
                    className={controlClass}
                    value={amenityData.website}
                    onChange={(e) =>
                      setAmenityData((prev) => ({ ...prev, website: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Feature">
                <SelectBox>
                  <select
                    className={selectClass}
                    value={amenityData.featureId}
                    onChange={(e) =>
                      setAmenityData((prev) => ({
                        ...prev,
                        featureId: Number(e.target.value) || 0,
                      }))
                    }
                  >
                    <option value={0}>Chọn Feature</option>
                    {features.map((feature) => (
                      <option key={feature.id} value={feature.id}>
                        {feature.id} - {feature.featureType}
                      </option>
                    ))}
                  </select>
                </SelectBox>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Unit ID">
                  <SelectBox>
                    <select
                      className={selectClass}
                      value={amenityData.unitId || ''}
                      onChange={(e) =>
                        setAmenityData((prev) => ({ ...prev, unitId: Number(e.target.value) || 0 }))
                      }
                    >
                      <option value="">Không gắn Unit</option>
                      {(unitGeoJson?.features ?? []).map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.id} - {unit.properties.unitName}
                        </option>
                      ))}
                    </select>
                  </SelectBox>
                </Field>
                <Field label="Amenity Category">
                  <SelectBox>
                    <select
                      className={selectClass}
                      value={amenityData.amenityCategoryId || ''}
                      onChange={(e) =>
                        setAmenityData((prev) => ({
                          ...prev,
                          amenityCategoryId: Number(e.target.value) || 0,
                        }))
                      }
                    >
                      <option value="">Chọn Amenity Category</option>
                      {amenityCategories.map((category) => (
                        <option key={category.amenityCateId} value={category.amenityCateId}>
                          {category.amenityCateName} - {category.amenityVietNameseName}
                        </option>
                      ))}
                    </select>
                  </SelectBox>
                </Field>
              </div>
            </>
          )}
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
              {error}
            </p>
          )}
        </section>
      </div>
    </Modal>
  )
}
