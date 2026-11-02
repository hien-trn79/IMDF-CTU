import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Modal, notification } from 'antd'
import { Maximize2, Minimize2 } from 'lucide-react'
import OutdoorMap from './OutdoorMap'
import OutdoorSidebar from './OutdoorSidebar'
import OutdoorTable, { type OutdoorFeatureItem } from './OutdoorTable'
import { useOutdoorFeatures } from './useOutdoorFeatures'
import FeatureDetailModal from './FeatureDetailModal'
import type { LevelGeoJson } from '../../model/geoJsonEntity.model'
import { useLevel } from '../../context/LevelContext'
import { useUser } from '../../context/UserContext'
import { unitService } from '../../services/unitService'
import UnitEditModal from './UnitEditModal'
import AnchorEditModal from './AnchorEditModal'
import AmenityEditModal from './AmenityEditModal'
import LevelEditModal from './LevelEditModal'
import ImportGeoJsonModal from './ImportGeoJsonModal'
import type { AnchorRequestPayload } from '../../model/IndoorRoute.model'
import { authHeaders } from '../../services/authHeaders'
import { outdoorTableService } from '../../services/outdoorTableService'

export default function PageOutdoor() {
  const [objectCount, setObjectCount] = useState(0)

  // State lưu trữ Feature được người dùng chọn từ OutdoorTable
  const [selectedFeature, setSelectedFeature] = useState<OutdoorFeatureItem | null>(null)

  // State quản lý modal chi tiết feature geometry được chọn
  const [isOpenSelectedFeatureModal, setIsOpenSelectedFeatureModal] = useState(false)
  const [isOpenUnitEditModal, setIsOpenUnitEditModal] = useState(false)

  // State quản lý modal chỉnh sửa anchor
  const [isOpenAnchorEditModal, setIsOpenAnchorEditModal] = useState(false)
  const [isOpenAmenityEditModal, setIsOpenAmenityEditModal] = useState(false)
  const [isOpenLevelEditModal, setIsOpenLevelEditModal] = useState(false)

  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFeatures, setImportFeatures] = useState<any[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [duplicateCount, setDuplicateCount] = useState(0)

  // Mở rộng toàn bộ bản đồ (Fullscreen API)
  const mapCardRef = useRef<HTMLDivElement>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  // Chiều cao bảng nổi, dùng để đẩy attribution/scale của Leaflet lên trên bảng
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)

  const {
    setSelectedLevelId,
    selectedLevelId,
    unitGeoJson,
    reloadUnits,
    reloadData,
    selectedTable,
    setSelectedTable,
    selectedTables,
    toggleTable,
  } = useLevel()
  const [selectedBuilding, setSelectedBuilding] = useState<number | 1>(1)
  const [levelsOfBuilding, setLevelsOfBuilding] = useState<LevelGeoJson['features'] | []>([])
  const selectedLevelOrdinal = levelsOfBuilding.find(
    (level) => String(level.id) === String(selectedLevelId)
  )?.properties.ordinal
  const selectedLevelGeometry = levelsOfBuilding.find(
    (level) => String(level.id) === String(selectedLevelId)
  )?.geometry as GeoJSON.Geometry | undefined
  const { features, isLoading } = useOutdoorFeatures(
    selectedBuilding,
    selectedLevelOrdinal,
    selectedLevelGeometry
  )
  const { token } = useUser()

  useEffect(() => {
    notification.config({
      placement: 'topRight',
      top: 76,
      duration: 3,
      maxCount: 3,
    })
  }, [])

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

  const handleCreate = () => {
    // Creation flow will be connected here when the feature form is available.
    console.info('Tạo đối tượng outdoor mới')
  }

  // Callback khi người dùng click vào row hoặc nút "Xem trên bản đồ" ở Table
  const handleSelectFeature = (item: OutdoorFeatureItem) => {
    setSelectedFeature(item)
  }

  const canonicalGeometry = (value: unknown): string => {
    if (typeof value === 'number') return String(Number(value.toFixed(8)))
    if (Array.isArray(value)) return `[${value.map(canonicalGeometry).join(',')}]`
    if (value && typeof value === 'object') {
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => `${JSON.stringify(key)}:${canonicalGeometry(child)}`)
        .join(',')}}`
    }
    return JSON.stringify(value)
  }

  const existingGeometryKeys = useMemo(
    () => new Set(features.map((item) => canonicalGeometry(item.feature.geometry))),
    [features]
  )

  const handleEditFeature = (item: OutdoorFeatureItem) => {
    if (item.layer.id === 'api-units') {
      setSelectedFeature(item)
      setIsOpenUnitEditModal(true)
      return
    }

    if (item.layer.id === 'api-anchors') {
      setSelectedFeature(item)
      setIsOpenAnchorEditModal(true)
      return
    }

    if (item.layer.id === 'api-amenities') {
      setSelectedFeature(item)
      setIsOpenAmenityEditModal(true)
      return
    }

    if (item.layer.id === 'api-level') {
      setSelectedFeature(item)
      setIsOpenLevelEditModal(true)
      return
    }

    if (item.layer.id !== 'api-units' && item.layer.id !== 'api-anchors') {
      notification.info({
        message: 'Không thể chỉnh sửa lớp này',
        description: 'Lớp dữ liệu này chưa hỗ trợ chỉnh sửa.',
      })
    }
  }

  const getFirstCoordinate = (coordinates: unknown): [number, number] | null => {
    if (!Array.isArray(coordinates)) return null
    if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
      return [coordinates[0], coordinates[1]]
    }
    for (const child of coordinates) {
      const coordinate = getFirstCoordinate(child)
      if (coordinate) return coordinate
    }
    return null
  }

  // Xử lý chức năng import GeoJSON: đọc file, lọc feature hợp lệ, loại bỏ trùng lặp, hiển thị modal xác nhận
  const handleImportGeoJson = async (file: File) => {
    if (!selectedLevelId) {
      notification.warning({
        message: 'Chưa chọn tầng',
        description: 'Vui lòng chọn tầng trước khi thêm dữ liệu GeoJSON.',
      })
      return
    }
    try {
      const parsed = JSON.parse(await file.text())
      const sourceFeatures = Array.isArray(parsed.features) ? parsed.features : [parsed]
      const validFeatures = sourceFeatures.filter((feature: any) => feature?.geometry)
      const seen = new Set(existingGeometryKeys)

      console.log('sourceFeatures', sourceFeatures)
      console.log('validFeatures', validFeatures)
      console.log('existingGeometryKeys', existingGeometryKeys)

      let duplicates = 0 // dùng để đếm số lượng feature trùng lặp đã bị loại bỏ
      const uniqueFeatures = validFeatures.filter((feature: any) => {
        const key = canonicalGeometry(feature.geometry)
        if (seen.has(key)) {
          duplicates += 1
          return false
        }
        seen.add(key)
        return true
      })
      console.log('uniqueFeatures', uniqueFeatures)
      setImportFeatures(uniqueFeatures)
      setDuplicateCount(duplicates)
      setImportFileName(file.name)
      setImportProgress(0)
      setImportModalOpen(true)
    } catch (error) {
      notification.error({
        message: 'Không thể đọc GeoJSON',
        description: error instanceof Error ? error.message : 'File không hợp lệ.',
      })
    }
  }

  // Xác nhận import GeoJSON vào cơ sở dữ liệu
  const confirmImport = async () => {
    if (!selectedLevelId) return
    setIsImporting(true)
    setImportProgress(0)
    let imported = 0
    try {
      for (const feature of importFeatures) {
        const coordinate = getFirstCoordinate(feature.geometry.coordinates)
        if (!coordinate) throw new Error('Một feature không có tọa độ hợp lệ.')
        const properties = feature.properties ?? {}
        console.log('selectedTable', selectedTable)
        // Neu selectedTable là 'unit' thì gọi unitService.create
        if (selectedTable === 'units') {
          await unitService.create(
            {
              unitName: String(
                properties.name_vi ??
                  properties.name ??
                  properties.id ??
                  `Unit ${properties.fid ?? imported + 1}`
              ),
              geometry: feature.geometry,
              displayPoint: properties.displayPoint ?? { type: 'Point', coordinates: coordinate },
              featureId: null,
              levelId: Number(selectedLevelId),
              unitCategoryId: Number(properties.unitCategoryId) || 1,
              restrictionCategoryId: Number(properties.restrictionCategoryId) || 1,
            },
            token ?? undefined
          )
        } else if (selectedTable === 'anchors') {
          const unitIdTemp = selectedLevelId === '4' ? 58 : 5

          const payload: AnchorRequestPayload = {
            anchorName: String(properties.anchorName ?? `Anchor ${properties.fid ?? imported + 1}`),
            geometry: feature.geometry,
            featureId: 63,
            unitId: unitIdTemp,
          }
          const response = await fetch(`http://localhost:8081/api/anchors`, {
            method: 'POST',
            headers: {
              ...authHeaders(token ?? '', true),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
          if (!response.ok) throw new Error(`Thêm Anchor thất bại (HTTP ${response.status}).`)
        } else if (selectedTable === 'amenities') {
          const unitIdTemp = selectedLevelId === '4' ? 58 : 5
          const payload: any = {
            amenityName: String(
              properties.amenityName ?? `Amenity ${properties.fid ?? imported + 1}`
            ),
            phone: String(properties.phone ?? ''),
            website: String(properties.website ?? ''),
            hours: properties.hours ? String(properties.hours).slice(0, 16) : '',
            geometry: feature.geometry,
            amenityCategoryId: Number(
              properties.amenityCategoryId ?? properties.amenityCateId ?? 12
            ),
            featureId: 64,
            unitId: unitIdTemp,
            levelId: Number(selectedLevelId),
          }

          console.log('amenity payload', payload)
          const response = await fetch(`http://localhost:8081/api/amenities`, {
            method: 'POST',
            headers: {
              ...authHeaders(token ?? '', true),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
          if (!response.ok) throw new Error(`Thêm Amenity thất bại (HTTP ${response.status}).`)
        }
        imported += 1
        setImportProgress(Math.round((imported / importFeatures.length) * 100))
      }
      reloadUnits()
      reloadData()
      setImportModalOpen(false)
      notification.success({
        message: 'Thêm GeoJSON thành công',
        description: `Đã thêm ${imported} ${selectedTable} vào cơ sở dữ liệu.`,
      })
    } catch (error) {
      notification.error({
        message: 'Thêm GeoJSON chưa hoàn tất',
        description: error instanceof Error ? error.message : 'Không thể lưu Unit.',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteFeature = (item: OutdoorFeatureItem) => {
    const tableByLayer: Record<string, { table: string; label: string }> = {
      'api-units': { table: 'units', label: 'Unit' },
      'api-anchors': { table: 'anchor', label: 'Anchor' },
      'api-amenities': { table: 'amenity', label: 'Amenity' },
    }
    const target = tableByLayer[item.layer.id]
    if (!target) return

    Modal.confirm({
      title: `Xóa ${target.label} này?`,
      content: `${target.label} "${item.feature.properties?.unitName ?? item.feature.properties?.anchorName ?? item.feature.id}" sẽ bị xóa khỏi cơ sở dữ liệu. Thao tác này không thể hoàn tác.`,
      okText: `Xóa ${target.label}`,
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await outdoorTableService.delete(target.table, item.feature.id, token ?? undefined)
          setSelectedFeature(null)
          if (item.layer.id === 'api-units') reloadUnits()
          reloadData()
          notification.success({
            message: `Đã xóa ${target.label}`,
            description: 'Dữ liệu đã được cập nhật.',
          })
        } catch (error) {
          notification.error({
            message: `Xóa ${target.label} thất bại`,
            description: error instanceof Error ? error.message : `Không thể xóa ${target.label}.`,
          })
        }
      },
    })
  }

  const handleLevelChange = (levelId: string | null) => {
    setSelectedLevelId(levelId)
  }

  // Mở modal chi tiết feature. Modal render ở document.body nên phải thoát fullscreen trước
  const handleOpenDetailModal = async (item: OutdoorFeatureItem | null) => {
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

  // Khoảng đệm quanh bản đồ: 8px ở chế độ thường, 0 khi fullscreen
  const inset = isMapFullscreen ? 0 : 8

  return (
    <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-5 px-2">
      {/* OUTDOOR MAIN MAP + BẢNG NỔI */}
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
          <OutdoorMap
            setObjectCount={setObjectCount}
            selectedFeature={selectedFeature}
            features={features}
            isLoading={isLoading}
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
            <OutdoorTable
              features={features}
              loading={isLoading}
              selectedFeature={selectedFeature}
              onSelectFeature={handleSelectFeature}
              onOpenDetailModal={handleOpenDetailModal}
              onEditFeature={handleEditFeature}
              onDeleteFeature={handleDeleteFeature}
            />
          </div>
        </div>
      </main>

      {/* OUTDOOR ASIDE: chỉ là khung chứa, OutdoorSidebar tự có card riêng nên không thêm viền/padding */}
      <aside className="outdoor_aside_map min-w-0 overflow-y-auto lg:col-span-1 lg:max-h-[min(85vh,720px)] justify-items-center">
        <OutdoorSidebar
          objectCount={objectCount}
          onCreate={handleCreate}
          selectedBuildingId={selectedBuilding}
          setSelectedBuildingId={setSelectedBuilding}
          levels={levelsOfBuilding}
          setLevels={setLevelsOfBuilding}
          onLevelChange={handleLevelChange}
          onImportGeoJson={handleImportGeoJson}
          selectedTables={selectedTables}
          onTableChange={setSelectedTable}
          onTableToggle={toggleTable}
        />
      </aside>

      {/* MODAL NHẬP DỮ LIỆU TỪ GEOJSON */}
      <ImportGeoJsonModal
        open={importModalOpen}
        setOpen={setImportModalOpen}
        confirmImport={confirmImport}
        isImporting={isImporting}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        importFileName={importFileName}
        importFeatures={importFeatures}
        duplicateCount={duplicateCount}
        importProgress={importProgress}
        selectedLevelOrdinal={selectedLevelOrdinal}
      />

      {/* MODAL HIỂN THỊ THÔNG TIN CHI TIẾT */}
      <FeatureDetailModal
        isOpenSelectedFeatureModal={isOpenSelectedFeatureModal}
        onClose={() => setIsOpenSelectedFeatureModal(false)}
        data={selectedFeature}
      />

      {/* MODAL SỬA ĐỔI UNIT */}
      <UnitEditModal
        open={isOpenUnitEditModal}
        item={selectedFeature?.layer.id === 'api-units' ? selectedFeature : null}
        levelId={selectedLevelId}
        token={token}
        onClose={() => setIsOpenUnitEditModal(false)}
        onSaved={() => {
          reloadUnits()
          notification.success({ message: 'Cập nhật Unit thành công' })
        }}
      />

      {/* MODAL SỬA ĐỔI ANCHOR */}
      <AnchorEditModal
        open={isOpenAnchorEditModal}
        item={selectedFeature?.layer.id === 'api-anchors' ? selectedFeature : null}
        anchorId={selectedFeature?.feature.id ?? null}
        token={token}
        units={unitGeoJson?.features ?? []}
        onClose={() => setIsOpenAnchorEditModal(false)}
        onSaved={() => {
          reloadData()
          notification.success({ message: 'Cập nhật Anchor thành công' })
        }}
      />

      <AmenityEditModal
        open={isOpenAmenityEditModal}
        item={selectedFeature?.layer.id === 'api-amenities' ? selectedFeature : null}
        token={token}
        units={unitGeoJson?.features ?? []}
        levels={levelsOfBuilding}
        selectedLevelId={selectedLevelId}
        onClose={() => setIsOpenAmenityEditModal(false)}
        onSaved={() => {
          reloadData()
          notification.success({ message: 'Cập nhật Amenity thành công' })
        }}
      />

      <LevelEditModal
        open={isOpenLevelEditModal}
        item={selectedFeature?.layer.id === 'api-level' ? selectedFeature : null}
        token={token}
        onClose={() => setIsOpenLevelEditModal(false)}
        onSaved={() => {
          reloadData()
          notification.success({ message: 'Cập nhật Level thành công' })
        }}
      />
    </div>
  )
}
