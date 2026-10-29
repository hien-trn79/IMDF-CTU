import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import {
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import type {
  DrawingGeometryMode,
  IMDFFeatureItem,
  IMDFFeatureType,
  IMDFNormalizeResponse,
  IMDFProperties,
  SysPublishedLayer,
} from '../../model/IMDF.model'
import { useIndoorDrawAndSnap } from './hooks/useIndoorDrawAndSnap'
import IndoorEditorMap from './components/IndoorEditorMap'
import IndoorFeatureTable from './components/IndoorFeatureTable'
import IndoorManagementSidebar from './components/IndoorManagementSidebar'
import ImdfFeatureModal from './components/ImdfFeatureModal'
import PublishLayerModal from './components/PublishLayerModal'
import type { ActiveLayerConfig } from './components/PublishedLayersManager'
import { imdfService } from '../../services/imdfService'
import { indoorRestApiService } from '../../services/indoorRestApiService'
import { useUser } from '../../context/UserContext'

export default function PageIndoorManagement() {
  const { authData } = useUser()
  const token = authData?.token || ''

  // 1. Quản lý Tầng & Lớp đang chọn
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1)
  const [levelsList, setLevelsList] = useState<any[]>([])

  // 2. Bật/Tắt hiển thị từng loại layer IMDF
  const [layerVisibility, setLayerVisibility] = useState<Record<IMDFFeatureType, boolean>>({
    unit: true,
    door: true,
    opening: true,
    fixture: true,
    building: true,
    footprint: true,
    anchor: true,
    level: true,
    venue: true,
  })

  // 3. Danh sách đối tượng IMDF THỰC TẾ lấy từ RestAPI / Database / GeoServer
  const [features, setFeatures] = useState<IMDFFeatureItem[]>([])
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<IMDFFeatureItem | null>(null)

  // 4. Quản lý Modal Chuẩn hóa IMDF & Thuộc tính
  const [isOpenFeatureModal, setIsOpenFeatureModal] = useState(false)
  const [isNormalizing, setIsNormalizing] = useState(false)
  const [normalizationResult, setNormalizationResult] =
    useState<IMDFNormalizeResponse | null>(null)
  const [normalizationError, setNormalizationError] = useState<string | null>(null)

  // 5. Quản lý Modal Publish Layer lên GeoServer
  const [isOpenPublishModal, setIsOpenPublishModal] = useState(false)
  const [publishedLayers, setPublishedLayers] = useState<SysPublishedLayer[]>([])
  const [isLoadingPublishedLayers, setIsLoadingPublishedLayers] = useState(false)
  const [activePublishedLayers, setActivePublishedLayers] = useState<
    Record<number, ActiveLayerConfig>
  >({})

  // 6. Toàn màn hình & Chiều cao bảng nổi (Đúng chuẩn layout Tab Route)
  const mapCardRef = useRef<HTMLDivElement>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(40)

  // Toast Thông báo
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Theo dõi chiều cao bảng nổi để đẩy attribution & controls Leaflet lên trên bảng
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setPanelHeight(Math.round(entry.contentRect.height))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Xử lý sự kiện Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(document.fullscreenElement === mapCardRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleMapFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await mapCardRef.current?.requestFullscreen()
      }
    } catch (e) {
      console.error('Fullscreen error:', e)
    }
  }

  // 7. TẢI DỮ LIỆU THỰC TẾ TỪ REST API & DATABASE (Không dùng mock, không tự sinh)
  const loadRealData = useCallback(async () => {
    setIsLoadingFeatures(true)
    setIsLoadingPublishedLayers(true)
    try {
      // a. Lấy danh sách Level thực tế từ RestAPI
      const levels = await indoorRestApiService.fetchLevels(token)
      if (levels.length > 0) {
        setLevelsList(levels)
      }

      // b. Lấy toàn bộ Features thực tế từ Database (Unit, Building, Opening, Anchor)
      const realDbFeatures = await indoorRestApiService.loadAllRealIndoorFeatures(
        selectedLevelId,
        token
      )

      // c. CHỈ lấy layers từ /api/layers (backend REST API) - không gọi GetCapabilities
      // để tránh dữ liệu trùng lặp hoặc giả
      const backendLayers = await imdfService.getPublishedLayers(token)
      setPublishedLayers(backendLayers)
      setActivePublishedLayers((current) => {
        const validLayerIds = new Set(backendLayers.map((layer) => layer.layerId))
        return Object.fromEntries(
          Object.entries(current).filter(([layerId]) => validLayerIds.has(Number(layerId)))
        )
      })

      // d. Chỉ set features từ database thực tế
      const featuresMap = new Map<string, IMDFFeatureItem>()
      realDbFeatures.forEach((f) => featuresMap.set(String(f.feature.id), f))

      const combined = Array.from(featuresMap.values())
      setFeatures(combined)
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thực tế từ RestAPI:', err)
    } finally {
      setIsLoadingFeatures(false)
      setIsLoadingPublishedLayers(false)
    }
  }, [selectedLevelId, token])

  // Tự động tải dữ liệu thực tế khi mount hoặc khi đổi tầng / token
  useEffect(() => {
    loadRealData()
  }, [loadRealData])

  // Hook điều khiển Vẽ & Snapping
  const handleGeometryComplete = useCallback(
    async (geometry: { type: string; coordinates: any }, featureType: IMDFFeatureType) => {
      setIsNormalizing(true)
      setNormalizationError(null)
      setIsOpenFeatureModal(true)

      try {
        // Gửi dữ liệu hình học tạm thời về Backend qua API để xử lý chuẩn hóa bằng JTS
        const response = await imdfService.normalizeGeometry(
          {
            featureType,
            geometry,
            properties: {
              level_id: selectedLevelId,
              feature_type: featureType,
            },
            simplifyTolerance: 0.000002,
          },
          token
        )

        setNormalizationResult(response)
        showToast(
          `Đã chuẩn hóa hình học IMDF thành công! ${response.message}`,
          response.valid ? 'success' : 'info'
        )
      } catch (err: any) {
        console.error('Lỗi chuẩn hóa IMDF:', err)
        setNormalizationError(err?.message || 'Lỗi chuẩn hóa hình học')
      } finally {
        setIsNormalizing(false)
      }
    },
    [selectedLevelId, token]
  )

  const drawHook = useIndoorDrawAndSnap({
    onGeometryComplete: handleGeometryComplete,
  })

  // Lưu đối tượng sau khi chuẩn hóa xong qua RestAPI Database
  const handleSaveFeature = async (properties: IMDFProperties) => {
    if (!normalizationResult) return

    try {
      // Nếu là Unit, gọi RestAPI [POST] /api/units để lưu trực tiếp vào CSDL
      if (properties.feature_type === 'unit') {
        await indoorRestApiService.createUnitInDatabase(
          {
            unitName: properties.name || `Unit ${Date.now()}`,
            geometry: normalizationResult.geometry,
            displayPoint: normalizationResult.displayPoint,
            levelId: Number(properties.level_id) || selectedLevelId || 1,
            unitCategoryId: 1,
            restrictionCategoryId: 1,
          },
          token
        )
        showToast(`Đã lưu phòng "${properties.name}" vào cơ sở dữ liệu!`, 'success')
      } else {
        showToast(`Đã thêm đối tượng "${properties.name}" vào layer!`, 'success')
      }

      // Tải lại dữ liệu thực tế từ Database
      await loadRealData()
    } catch (err: any) {
      console.warn('Lỗi khi lưu Unit vào CSDL, cập nhật trên canvas:', err)
      const newFeatureItem: IMDFFeatureItem = {
        feature: {
          type: 'Feature',
          id: properties.id,
          properties: properties,
          geometry: normalizationResult.geometry as any,
        },
        isDraft: false,
      }
      setFeatures((prev) => [newFeatureItem, ...prev])
    }

    setIsOpenFeatureModal(false)
    setNormalizationResult(null)
  }

  // Xóa đối tượng
  const handleDeleteFeature = (id: string) => {
    setFeatures((prev) => prev.filter((f) => f.feature?.properties?.id !== id))
    if (selectedFeature?.feature?.properties?.id === id) {
      setSelectedFeature(null)
    }
    showToast('Đã xóa đối tượng khỏi Layer', 'info')
  }

  // Toggle layer visibility của từng loại feature
  const handleToggleLayerType = (type: IMDFFeatureType) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  // Toggle published layer visibility
  const handleTogglePublishedLayer = (layerId: number, visible: boolean) => {
    setActivePublishedLayers((prev) => {
      const layerObj = publishedLayers.find((l) => l.layerId === layerId)
      if (!layerObj) return prev
      return {
        ...prev,
        [layerId]: {
          layer: layerObj,
          visible,
          renderMode: prev[layerId]?.renderMode || 'WMS',
          opacity: prev[layerId]?.opacity ?? 0.85,
        },
      }
    })
  }

  // Khoảng đệm quanh bản đồ: 8px ở chế độ thường, 0 khi fullscreen
  const inset = isMapFullscreen ? 0 : 8

  return (
    <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-5 px-2">
      {/* TOAST ALERT NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-[3000] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl border animate-slideDown ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
              : toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-700/60'
                : 'bg-blue-950/90 text-blue-200 border-blue-700/60'
          }`}
        >
          {toastMessage.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {toastMessage.type === 'error' && (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          {toastMessage.type === 'info' && (
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* CỘT CHÍNH (4 CỘT): MAP VÀ BẢNG THUỘC TÍNH NỔI ĐÚNG CHUẨN TAB ROUTE */}
      <main className="page-indoor-main min-w-0 lg:col-span-4">
        <div
          ref={mapCardRef}
          style={
            {
              // Bảng cách đáy card 16px, chừa thêm 4px khe hở
              '--map-bottom-offset': `${panelHeight + 20 - inset}px`,
            } as CSSProperties
          }
          className={`outdoor_map relative isolate overflow-hidden bg-white [&_.leaflet-bottom]:mb-(--map-bottom-offset) ${
            isMapFullscreen
              ? 'h-screen w-screen rounded-none border-0 p-0'
              : 'h-[min(89vh,720px)] min-h-82.5 rounded-2xl border border-sky-100 p-2 shadow-sm'
          }`}
        >
          {/* MAP CANVAS COMPONENT */}
          <IndoorEditorMap
            features={features}
            selectedFeature={selectedFeature}
            onSelectFeature={(item) => setSelectedFeature(item)}
            drawingMode={drawHook.drawingMode}
            targetFeatureType={drawHook.targetFeatureType}
            snapEnabled={drawHook.snapEnabled}
            snapTolerancePx={drawHook.snapTolerancePx}
            coordinates={drawHook.coordinates}
            currentSnap={drawHook.currentSnap}
            areaSqm={drawHook.currentAreaSqm}
            lengthMeters={drawHook.currentLengthMeters}
            activePublishedLayers={activePublishedLayers}
            selectedLevelId={selectedLevelId}
            layerVisibility={layerVisibility}
            onStartDrawing={drawHook.startDrawing}
            onToggleSnap={() => drawHook.setSnapEnabled(!drawHook.snapEnabled)}
            onUndo={drawHook.undoCoordinate}
            onFinish={drawHook.finishDrawing}
            onCancel={drawHook.cancelDrawing}
            onAddCoordinate={drawHook.addCoordinate}
            onSnapChange={drawHook.setCurrentSnap}
            onMouseMovePosition={drawHook.setMousePosition}
          />

          {/* Nút mở rộng bản đồ (Fullscreen), nằm ngay dưới nút zoom +/- của Leaflet giống Tab Route */}
          <button
            type="button"
            onClick={toggleMapFullscreen}
            title={isMapFullscreen ? 'Thu nhỏ bản đồ' : 'Mở rộng toàn bộ bản đồ'}
            aria-label={isMapFullscreen ? 'Thu nhỏ bản đồ' : 'Mở rộng toàn bộ bản đồ'}
            style={{ left: 10 + inset, top: 84 + inset }}
            className="absolute z-1000 flex h-8.5 w-8.5 items-center justify-center rounded border-2 border-black/20 bg-white bg-clip-padding text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs"
          >
            {isMapFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* BẢNG THUỘC TÍNH NỔI TRÊN KHUNG MAP (QGIS STYLE THU GỌN / MỞ RỘNG) */}
          <div ref={panelRef} className="absolute right-1 bottom-1 left-1 z-1000">
            <IndoorFeatureTable
              features={features.filter((f) => {
                const lvl = f.feature?.properties?.level_id
                return lvl === undefined || lvl === null || Number(lvl) === selectedLevelId
              })}
              selectedFeature={selectedFeature}
              onSelectFeature={(item) => setSelectedFeature(item)}
              onDeleteFeature={handleDeleteFeature}
              onOpenDetailModal={() => {
                if (selectedFeature) {
                  setNormalizationResult({
                    valid: true,
                    message: 'Chi tiết đối tượng',
                    featureType: selectedFeature.feature.properties.feature_type,
                    geometry: selectedFeature.feature.geometry as any,
                    displayPoint: selectedFeature.feature.properties.display_point
                      ? {
                          type: 'Point',
                          coordinates: selectedFeature.feature.properties.display_point,
                        }
                      : undefined,
                    properties: selectedFeature.feature.properties,
                    bbox: [0, 0, 0, 0],
                    areaSqm: selectedFeature.feature.properties.area_sqm || 0,
                    lengthMeters: selectedFeature.feature.properties.length_meters || 0,
                    vertexCount: selectedFeature.feature.properties.vertex_count || 0,
                    geometryType: selectedFeature.feature.geometry.type,
                  })
                  setIsOpenFeatureModal(true)
                }
              }}
            />
          </div>
        </div>
      </main>

      {/* CỘT PHỤ (1 CỘT): SIDEBAR ĐIỀU KHIỂN DÀNH CHO QUẢN TRỊ VIÊN ĐÚNG CHUẨN TAB ROUTE */}
      <aside className="outdoor_aside_map min-w-0 overflow-y-auto lg:col-span-1 lg:max-h-[min(85vh,720px)] justify-items-center">
        <IndoorManagementSidebar
          isLoading={isLoadingFeatures || isLoadingPublishedLayers}
          features={features}
          selectedLevelId={selectedLevelId}
          levels={levelsList}
          onSelectLevelId={(lvl) => setSelectedLevelId(lvl)}
          onRefresh={() => {
            loadRealData()
            showToast('Đang tải dữ liệu thực tế từ Database & GeoServer...', 'info')
          }}
          onOpenAddModal={() => {
            drawHook.startDrawing('polygon', 'unit')
            showToast('Chế độ vẽ Polygon đã kích hoạt! Hãy nhấp trên bản đồ.', 'info')
          }}
          onOpenPublishModal={() => setIsOpenPublishModal(true)}
          layerVisibility={layerVisibility}
          onToggleLayerType={handleToggleLayerType}
          snapEnabled={drawHook.snapEnabled}
          onToggleSnap={() => drawHook.setSnapEnabled(!drawHook.snapEnabled)}
          onQuickDraw={(type) => {
            let mode: DrawingGeometryMode = 'polygon'
            if (type === 'door' || type === 'opening') mode = 'linestring'
            if (type === 'fixture' || type === 'anchor') mode = 'point'
            drawHook.startDrawing(mode, type)
            showToast(`Đang vẽ đối tượng ${type.toUpperCase()}`, 'info')
          }}
          publishedLayers={publishedLayers}
          activePublishedLayers={activePublishedLayers}
          onTogglePublishedLayer={handleTogglePublishedLayer}
        />
      </aside>

      {/* MODAL 1: CHUẨN HÓA IMDF & THUỘC TÍNH */}
      <ImdfFeatureModal
        isOpen={isOpenFeatureModal}
        isLoading={isNormalizing}
        normalizeData={normalizationResult}
        error={normalizationError}
        onClose={() => {
          setIsOpenFeatureModal(false)
          setNormalizationResult(null)
          setNormalizationError(null)
        }}
        onSave={handleSaveFeature}
      />

      {/* MODAL 2: PUBLISH LAYER LÊN GEOSERVER */}
      <PublishLayerModal
        isOpen={isOpenPublishModal}
        currentLayerName={`unit_level_${selectedLevelId}`}
        currentLevelId={selectedLevelId}
        currentFeatureCount={
          features.filter((f) => Number(f.feature?.properties?.level_id || 1) === selectedLevelId)
            .length
        }
        onClose={() => setIsOpenPublishModal(false)}
        onSuccess={(newLayer) => {
          showToast(`Xuất bản thành công layer ${newLayer.layerName} lên GeoServer!`, 'success')
          loadRealData()
        }}
      />
    </div>
  )
}
