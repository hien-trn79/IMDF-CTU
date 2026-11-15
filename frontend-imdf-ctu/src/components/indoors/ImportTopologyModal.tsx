import { Modal, Progress, notification } from 'antd'
import {
  AlertCircle,
  FileCode2,
  Layers,
  Network,
  Route,
  UploadCloud,
  Waypoints,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GridlineType, type IndoorRouteResponse } from '../../model/IndoorRoute.model'
import type { NetworkEdgeResponse } from '../../model/route models/NetworkEdge.model'
import type { NetworkNodeResponse } from '../../model/route models/NetworkNode.model'
import { authHeaders } from '../../services/authHeaders'
import { gridLineService } from '../../services/gridLineService'
import { indoorRouteService } from '../../services/indoorRouteService'
import { networkEdgeService, normalizeEdge } from '../../services/networkEdgeService'
import { networkNodeService, normalizeNode } from '../../services/networkNodeService'
import {
  type BatchTopologyInputLine,
  type Coordinate,
  normalizeTopologyBatch,
} from '../../utils/topologyUtils'
import {
  calcPolylineLengthMeters,
  coordToPointGeometry,
  coordsToLineStringGeometry,
  formatLength,
  parseWKBHexToCoords,
} from '../../utils/wkbUtils'

interface LevelItem {
  id: string | number
  properties?: {
    ordinal?: number
    buildingId?: number
    levelId?: string
    [key: string]: unknown
  }
}

interface BuildingItem {
  id: string | number
  properties?: {
    buildingName?: string
    [key: string]: unknown
  }
}

interface ImportTopologyModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess: () => void
  token: string
  initialFile?: File | null
  currentLevelId?: string | number | null
}

export default function ImportTopologyModal({
  open,
  setOpen,
  onSuccess,
  token,
  initialFile = null,
  currentLevelId = null,
}: ImportTopologyModalProps) {
  const [file, setFile] = useState<File | null>(initialFile)
  const [parsedLines, setParsedLines] = useState<BatchTopologyInputLine[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  // Dữ liệu từ REST API backend
  const [levels, setLevels] = useState<LevelItem[]>([])
  const [buildings, setBuildings] = useState<BuildingItem[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<string | number>(currentLevelId ?? '')

  const [routes, setRoutes] = useState<IndoorRouteResponse[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<number | 'NEW'>('NEW')
  const [newRouteName, setNewRouteName] = useState<string>('')

  const [category, setCategory] = useState<GridlineType>(GridlineType.CORRIDOR)
  const [isOneWay, setIsOneWay] = useState<boolean>(false)

  // Tiến trình import
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [progressStatusText, setProgressStatusText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 1. Fetch danh sách Levels và Buildings từ REST API khi Modal mở
  useEffect(() => {
    if (!open) return

    const fetchLevelsAndBuildings = async () => {
      try {
        const [lvlRes, bldRes] = await Promise.all([
          fetch('http://localhost:8081/api/levels', { headers: authHeaders(token) }),
          fetch('http://localhost:8081/api/buildings', { headers: authHeaders(token) }),
        ])

        if (lvlRes.ok) {
          const lvlData = (await lvlRes.json()) as { features?: LevelItem[] }
          const features = lvlData.features || []
          setLevels(features)

          // Nếu chưa chọn level, ưu tiên chọn currentLevelId hoặc level đầu tiên
          if (!selectedLevelId && features.length > 0) {
            setSelectedLevelId(currentLevelId ?? features[0].id)
          }
        }

        if (bldRes.ok) {
          const bldData = (await bldRes.json()) as { features?: BuildingItem[] }
          setBuildings(bldData.features || [])
        }
      } catch (err) {
        console.error('Lỗi khi fetch danh sách Tầng/Tòa nhà:', err)
      }
    }

    fetchLevelsAndBuildings()
  }, [open, token, currentLevelId])

  // Cập nhật selectedLevelId khi currentLevelId từ cha truyền vào
  useEffect(() => {
    if (currentLevelId && !selectedLevelId) {
      setSelectedLevelId(currentLevelId)
    }
  }, [currentLevelId])

  // Map ID tòa nhà -> tên tòa nhà
  const buildingMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const b of buildings) {
      map.set(Number(b.id), b.properties?.buildingName || `Tòa nhà #${b.id}`)
    }
    return map
  }, [buildings])

  // 2. Fetch danh sách IndoorRoutes theo LevelId được chọn từ REST API
  useEffect(() => {
    if (!selectedLevelId) {
      setRoutes([])
      return
    }

    const fetchRoutes = async () => {
      try {
        const res = await fetch(
          `http://localhost:8081/api/indoor-routes?levelId=${selectedLevelId}`,
          { headers: authHeaders(token) }
        )
        if (res.ok) {
          const routeList = (await res.json()) as IndoorRouteResponse[]
          setRoutes(routeList)
          if (routeList.length > 0) {
            setSelectedRouteId(routeList[0].id)
          } else {
            setSelectedRouteId('NEW')
            const currentLevel = levels.find((l) => String(l.id) === String(selectedLevelId))
            const ordinal = currentLevel?.properties?.ordinal ?? ''
            setNewRouteName(`Tuyến đường chính Tầng ${ordinal}`)
          }
        } else {
          setRoutes([])
          setSelectedRouteId('NEW')
        }
      } catch (err) {
        console.error('Lỗi khi fetch IndoorRoutes:', err)
        setRoutes([])
        setSelectedRouteId('NEW')
      }
    }

    fetchRoutes()
  }, [selectedLevelId, token, levels])

  // 3. Phân tích file GeoJSON khi có file mới
  useEffect(() => {
    if (initialFile) {
      setFile(initialFile)
    }
  }, [initialFile])

  useEffect(() => {
    if (!file) {
      setParsedLines([])
      setParseError(null)
      return
    }

    const readFile = async () => {
      try {
        setParseError(null)
        const text = await file.text()
        const json = JSON.parse(text)
        const features = Array.isArray(json.features)
          ? json.features
          : Array.isArray(json)
            ? json
            : [json]

        const extracted: BatchTopologyInputLine[] = []

        for (const f of features) {
          const geom = f.geometry || f
          const props = f.properties || {}

          // Xác định category nếu feature có sẵn thuộc tính
          let featureCat: GridlineType | undefined = undefined
          const catProp = String(
            props.category || props.type || props.routeType || ''
          ).toUpperCase()
          if (Object.values(GridlineType).includes(catProp as GridlineType)) {
            featureCat = catProp as GridlineType
          }

          const featureOneWay =
            typeof props.isOneWay === 'boolean'
              ? props.isOneWay
              : typeof props.oneway === 'boolean'
                ? props.oneway
                : undefined

          if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
            if (geom.coordinates.length >= 2) {
              extracted.push({
                coords: geom.coordinates as Coordinate[],
                category: featureCat,
                isOneWay: featureOneWay,
              })
            }
          } else if (geom.type === 'MultiLineString' && Array.isArray(geom.coordinates)) {
            for (const line of geom.coordinates) {
              if (Array.isArray(line) && line.length >= 2) {
                extracted.push({
                  coords: line as Coordinate[],
                  category: featureCat,
                  isOneWay: featureOneWay,
                })
              }
            }
          }
        }

        if (extracted.length === 0) {
          throw new Error(
            'Tập tin không chứa hình học đường đi (LineString hoặc MultiLineString) hợp lệ.'
          )
        }

        setParsedLines(extracted)

        // Nếu file có property `level`, gợi ý chọn tầng tương ứng nếu tìm thấy
        const detectedLevel = features[0]?.properties?.level
        if (detectedLevel !== undefined && detectedLevel !== null && levels.length > 0) {
          const matchLevel = levels.find((l) => l.properties?.ordinal === Number(detectedLevel))
          if (matchLevel) {
            setSelectedLevelId(matchLevel.id)
          }
        }
      } catch (err) {
        setParsedLines([])
        setParseError(err instanceof Error ? err.message : 'Lỗi khi đọc file GeoJSON.')
      }
    }

    readFile()
  }, [file, levels])

  // Tính tổng chiều dài tất cả các đường đi trong file
  const totalLengthMeters = useMemo(() => {
    return parsedLines.reduce((acc, line) => acc + calcPolylineLengthMeters(line.coords), 0)
  }, [parsedLines])

  // 4. Thực thi Chuẩn hóa Topology & Lưu dữ liệu vào REST API backend
  const handleStartImport = async () => {
    setErrorMessage(null)

    if (!selectedLevelId) {
      setErrorMessage('Vui lòng chọn Tầng cần import dữ liệu.')
      return
    }

    if (parsedLines.length === 0) {
      setErrorMessage('Vui lòng chọn tập tin GeoJSON có chứa dữ liệu đường đi hợp lệ.')
      return
    }

    setIsImporting(true)
    setImportProgress(5)
    setProgressStatusText('Đang nạp dữ liệu đỉnh và cạnh hiện tại của tầng...')

    try {
      let finalRouteId: number

      // 4.1. Xác định hoặc Tạo Tuyến đường (IndoorRoute)
      if (selectedRouteId === 'NEW') {
        const routeName =
          newRouteName.trim() ||
          `Tuyến đường Tầng ${levels.find((l) => String(l.id) === String(selectedLevelId))?.properties?.ordinal ?? ''}`
        setProgressStatusText(`Đang tạo tuyến đường mới: "${routeName}"...`)

        const createdRoute = await indoorRouteService.create(
          {
            indoorRouteName: routeName,
            levelId: Number(selectedLevelId),
            indoorRouteType: 'MAIN',
            status: 'ACTIVE',
          },
          token
        )
        finalRouteId = Number(createdRoute.id)
      } else {
        finalRouteId = Number(selectedRouteId)
      }

      setImportProgress(15)
      setProgressStatusText('Đang lấy các đỉnh (Nodes) và cạnh (Edges) hiện có...')

      // 4.2. Lấy existingNodes và existingEdges của tầng/tuyến đường để tính giao cắt
      let existingNodes: NetworkNodeResponse[] = []
      let existingEdges: NetworkEdgeResponse[] = []

      try {
        const [nodeRes, edgeRes] = await Promise.all([
          fetch(`http://localhost:8081/api/network-nodes?routeId=${finalRouteId}`, {
            headers: authHeaders(token),
          }),
          fetch(`http://localhost:8081/api/network-edges?routeId=${finalRouteId}`, {
            headers: authHeaders(token),
          }),
        ])

        if (nodeRes.ok) {
          const nData = await nodeRes.json()
          existingNodes = (nData.features || []).map(normalizeNode)
        }
        if (edgeRes.ok) {
          const eData = await edgeRes.json()
          existingEdges = (eData.features || []).map(normalizeEdge)
        }
      } catch (fetchErr) {
        console.warn('Không tải được topology hiện tại, tiếp tục với đồ thị mới:', fetchErr)
      }

      setImportProgress(25)
      setProgressStatusText(
        `Đang chuẩn hóa topology: Tính giao cắt cho ${parsedLines.length} đoạn đường...`
      )

      // 4.3. Chạy thuật toán Batch Topology Normalization
      const batchResult = normalizeTopologyBatch(
        parsedLines,
        existingNodes,
        existingEdges,
        finalRouteId,
        isOneWay,
        category
      )

      setImportProgress(35)
      setProgressStatusText(
        `Chuẩn hóa xong: ${batchResult.nodesToCreate.length} nodes mới, ${batchResult.edgesToCreate.length} edges mới.`
      )

      // 4.4. Tạo các NetworkNodes mới qua REST API
      const nodeMap = new Map<string | number, number>()
      let createdNodeCount = 0

      for (const nodeReq of batchResult.nodesToCreate) {
        const createdNode = await networkNodeService.create(
          {
            geometry: coordToPointGeometry(nodeReq.coord),
            isConnector: nodeReq.isConnector,
            indoorRouteId: nodeReq.indoorRouteId,
          },
          token
        )
        const realId = Number(createdNode.id)
        if (nodeReq.tempId) {
          nodeMap.set(nodeReq.tempId, realId)
        }
        createdNodeCount++

        if (createdNodeCount % 5 === 0 || createdNodeCount === batchResult.nodesToCreate.length) {
          const pct = 35 + Math.round((createdNodeCount / batchResult.nodesToCreate.length) * 25)
          setImportProgress(pct)
          setProgressStatusText(
            `Đang tạo NetworkNodes (${createdNodeCount}/${batchResult.nodesToCreate.length})...`
          )
        }
      }

      // 4.5. Xóa các Edge cũ bị tách giao cắt
      if (batchResult.edgesToDelete.length > 0) {
        setProgressStatusText(`Đang cập nhật ${batchResult.edgesToDelete.length} edges cũ...`)
        for (const edgeIdToDelete of batchResult.edgesToDelete) {
          await networkEdgeService.delete(edgeIdToDelete, token)
        }
      }

      setImportProgress(65)
      setProgressStatusText('Đang tạo các cạnh NetworkEdges chuẩn hóa...')

      // 4.6. Tạo các NetworkEdges mới qua REST API
      const resolveNodeId = (id: string | number): number | undefined => {
        if (typeof id === 'number') return id
        if (nodeMap.has(id)) return nodeMap.get(id)
        const parsed = Number(id)
        return Number.isFinite(parsed) ? parsed : undefined
      }

      let createdEdgeCount = 0
      for (const edgeReq of batchResult.edgesToCreate) {
        const sourceId = resolveNodeId(edgeReq.source)
        const targetId = resolveNodeId(edgeReq.target)

        if (!sourceId || !targetId || sourceId === targetId) continue

        const edgeCoords =
          edgeReq.coordinates && edgeReq.coordinates.length >= 2
            ? edgeReq.coordinates
            : parseWKBHexToCoords(edgeReq.geometry)

        if (!edgeCoords || edgeCoords.length < 2) continue

        await networkEdgeService.create(
          {
            source: sourceId,
            target: targetId,
            cost: edgeReq.cost,
            reverseCost: edgeReq.reverseCost,
            geometry: coordsToLineStringGeometry(edgeCoords),
            indoorRouteId: edgeReq.indoorRouteId,
          },
          token
        )
        createdEdgeCount++

        if (createdEdgeCount % 5 === 0 || createdEdgeCount === batchResult.edgesToCreate.length) {
          const pct = 65 + Math.round((createdEdgeCount / batchResult.edgesToCreate.length) * 20)
          setImportProgress(pct)
          setProgressStatusText(
            `Đang tạo NetworkEdges (${createdEdgeCount}/${batchResult.edgesToCreate.length})...`
          )
        }
      }

      setImportProgress(85)
      setProgressStatusText('Đang lưu các đối tượng đường đi GridLines...')

      // 4.7. Tạo các GridLines mới qua REST API
      let createdGridLineCount = 0
      for (const gLine of batchResult.gridLinesToCreate) {
        await gridLineService.create(
          {
            category: gLine.category,
            isOneWay: gLine.isOneWay,
            indoorRouteId: gLine.indoorRouteId,
            geometry: coordsToLineStringGeometry(gLine.coordinates),
          },
          token
        )
        createdGridLineCount++

        if (
          createdGridLineCount % 5 === 0 ||
          createdGridLineCount === batchResult.gridLinesToCreate.length
        ) {
          const pct =
            85 + Math.round((createdGridLineCount / batchResult.gridLinesToCreate.length) * 15)
          setImportProgress(pct)
        }
      }

      setImportProgress(100)
      setProgressStatusText('Nhập dữ liệu và chuẩn hóa topology hoàn tất thành công!')

      notification.success({
        message: 'Thêm tập tin Topology thành công',
        description: `Đã chuẩn hóa và tạo thành công: ${batchResult.gridLinesToCreate.length} GridLines, ${batchResult.nodesToCreate.length} Nodes, ${batchResult.edgesToCreate.length} Edges${
          batchResult.edgesToDelete.length > 0
            ? ` (tách ${batchResult.edgesToDelete.length} edges cũ)`
            : ''
        }.`,
        placement: 'topRight',
        duration: 5,
      })

      setTimeout(() => {
        setIsImporting(false)
        setOpen(false)
        onSuccess()
      }, 700)
    } catch (err: unknown) {
      setIsImporting(false)
      const msg = err instanceof Error ? err.message : 'Quá trình import topology thất bại.'
      setErrorMessage(msg)
      notification.error({
        message: 'Lỗi khi thêm tập tin Topology',
        description: msg,
      })
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Thêm tập tin Topology & Chuẩn hóa</h3>
            <p className="text-xs font-normal text-slate-500">
              Nhập và tự động chuẩn hóa mạng lưới đỉnh/cạnh từ file GeoJSON
            </p>
          </div>
        </div>
      }
      open={open}
      onCancel={() => !isImporting && setOpen(false)}
      onOk={handleStartImport}
      okText={isImporting ? 'Đang chuẩn hóa & Lưu...' : 'Bắt đầu thêm dữ liệu'}
      cancelText="Hủy"
      confirmLoading={isImporting}
      closable={!isImporting}
      maskClosable={!isImporting}
      centered
      width={540}
    >
      <div className="space-y-4 pt-2">
        {/* Khu vực chọn / hiển thị file */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Tập tin Topology (GeoJSON)</label>
            <label className="cursor-pointer text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              {file ? 'Đổi tập tin khác' : 'Chọn tập tin'}
              <input
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                className="hidden"
                disabled={isImporting}
                onChange={(e) => {
                  const selected = e.target.files?.[0]
                  if (selected) setFile(selected)
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          {file ? (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-2.5 shadow-xs">
              <div className="flex items-center gap-2.5 truncate">
                <FileCode2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div className="truncate">
                  <p className="truncate text-xs font-bold text-slate-800">{file.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {parsedLines.length} đường đi hợp lệ
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {formatLength(totalLengthMeters)}
              </span>
            </div>
          ) : (
            <label className="mt-2 flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white transition hover:border-emerald-400 hover:bg-emerald-50/30">
              <UploadCloud className="h-7 w-7 text-slate-400" />
              <span className="mt-1 text-xs font-semibold text-slate-600">
                Click hoặc kéo thả file GeoJSON vào đây
              </span>
              <span className="text-[11px] text-slate-400">Hỗ trợ .geojson, .json</span>
              <input
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0]
                  if (selected) setFile(selected)
                  e.target.value = ''
                }}
              />
            </label>
          )}

          {parseError && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* 1. Chọn Tầng (LevelId) - BẮT BUỘC */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Layers className="h-3.5 w-3.5 text-sky-600" />
              Tầng sẽ import (Level){' '}
              <span className="text-rose-500">
                {selectedLevelId === 4 ? 'Tầng Trệt' : 'Tầng 1'}
              </span>
            </span>
            {/* <select
              value={selectedLevelId}
              disabled={isImporting}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
            >
              <option value="">-- Chọn tầng để import --</option>
              {levels.map((lvl) => {
                const bldId = lvl.properties?.buildingId
                const bldName =
                  (bldId ? buildingMap.get(Number(bldId)) : null) ||
                  (bldId ? `Tòa nhà #${bldId}` : '')
                return (
                  <option key={lvl.id} value={lvl.id}>
                    Tầng {lvl.properties?.ordinal ?? ''} {bldName ? `(${bldName})` : ''}
                  </option>
                )
              })}
            </select> */}
            {/* <span className="mt-1 block text-[11px] font-normal text-slate-500">
              Dữ liệu topology sẽ được gán theo khóa chính <code>levelId</code> từ REST API.
            </span> */}
          </label>
        </div>

        {/* 2. Chọn hoặc tạo Tuyến đường (Indoor Route) */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Route className="h-3.5 w-3.5 text-emerald-600" />
              Tuyến đường trong nhà (Indoor Route) liên kết <span className="text-rose-500">*</span>
            </span>
            <select
              value={selectedRouteId}
              disabled={isImporting}
              onChange={(e) => {
                const val = e.target.value === 'NEW' ? 'NEW' : Number(e.target.value)
                setSelectedRouteId(val)
              }}
              className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
            >
              {routes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.indoorRouteName}
                </option>
              ))}
              <option value="NEW">➕ Tạo tuyến đường mới...</option>
            </select>
          </label>

          {selectedRouteId === 'NEW' && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Nhập tên tuyến đường mới (VD: Tuyến đường chính Tầng 1)"
                value={newRouteName}
                disabled={isImporting}
                onChange={(e) => setNewRouteName(e.target.value)}
                className="h-9 w-full rounded-lg border border-emerald-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
              />
            </div>
          )}
        </div>

        {/* 3. Phân loại và Đường một chiều */}
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <label className="block text-xs font-bold text-slate-700">
            Phân loại mặc định
            <select
              value={category}
              disabled={isImporting}
              onChange={(e) => setCategory(e.target.value as GridlineType)}
              className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
            >
              {Object.values(GridlineType).map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col justify-end">
            <label className="flex h-9.5 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={isOneWay}
                disabled={isImporting}
                onChange={(e) => setIsOneWay(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Đường một chiều (One-Way)
            </label>
          </div>
        </div>

        {/* Thông tin chuẩn hóa Topology */}
        <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-3 text-xs text-sky-900">
          <div className="flex items-center gap-1.5 font-bold text-sky-800">
            <Waypoints className="h-4 w-4" />
            <span>Tự động chuẩn hóa Topology khi lưu:</span>
          </div>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] text-sky-800">
            <li>Tự động tìm và cắt tại tất cả các điểm giao cắt giữa các đoạn đường.</li>
            <li>Hợp nhất các đỉnh (Nodes) lân cận nằm trong phạm vi ~1m để kết nối đồ thị.</li>
            <li>Tạo cấu trúc cạnh (Edges) hai chiều hoặc một chiều tương thích với pgRouting.</li>
            <li>Lưu danh sách đường GridLine vào hệ thống bản đồ indoor.</li>
          </ul>
        </div>

        {/* Trạng thái và Progress bar khi đang import */}
        {isImporting && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                {progressStatusText}
              </span>
              <span>{importProgress}%</span>
            </div>
            <Progress
              percent={importProgress}
              status="active"
              strokeColor={{ '0%': '#10b981', '100%': '#059669' }}
            />
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
