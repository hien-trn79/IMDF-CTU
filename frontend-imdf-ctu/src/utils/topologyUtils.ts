import type { NetworkEdgeResponse } from '../model/route models/NetworkEdge.model'
import type { NetworkNodeResponse } from '../model/route models/NetworkNode.model'
import { GridlineType } from '../model/IndoorRoute.model'
import { pointToWkbHex, lineStringToWkbHex } from './wkbEncoder'
import { parseWKBHexToCoords, calcPolylineLengthMeters } from './wkbUtils'
import { wkbHexToPoint } from './wkbParser'

export type Coordinate = [number, number] // [lng, lat]

export interface SnapResult {
  point: Coordinate
  type: 'node' | 'vertex' | 'edge' | 'none'
  targetInfo: string
  distancePx: number
}

const EPSILON = 1e-9
const COORD_TOLERANCE = 1e-5 // ~1 meter tolerance for node matching

/**
 * Tính giao điểm giữa 2 đoạn thẳng (p1-p2) và (p3-p4)
 */
export function getLineIntersection(
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): Coordinate | null {
  const [x1, y1] = p1
  const [x2, y2] = p2
  const [x3, y3] = p3
  const [x4, y4] = p4

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (Math.abs(denom) < EPSILON) return null // Song song hoặc trùng nhau

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    const ix = x1 + ua * (x2 - x1)
    const iy = y1 + ua * (y2 - y1)
    return [ix, iy]
  }

  return null
}

/**
 * Tính khoảng cách vuông góc từ điểm P tới đoạn thẳng A-B và vị trí chiếu P_proj
 */
export function projectPointToSegment(
  p: Coordinate,
  a: Coordinate,
  b: Coordinate
): { point: Coordinate; ratio: number } {
  const [px, py] = p
  const [ax, ay] = a
  const [bx, by] = b

  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy

  if (lenSq < EPSILON) {
    return { point: [ax, ay], ratio: 0 }
  }

  let ratio = ((px - ax) * dx + (py - ay) * dy) / lenSq
  ratio = Math.max(0, Math.min(1, ratio))

  return {
    point: [ax + ratio * dx, ay + ratio * dy],
    ratio,
  }
}

/**
 * Kiểm tra 2 tọa độ có gần như trùng nhau không
 */
export function isSameCoordinate(c1: Coordinate, c2: Coordinate, tol = COORD_TOLERANCE): boolean {
  return Math.hypot(c1[0] - c2[0], c1[1] - c2[1]) <= tol
}

export interface EdgeSplitInfo {
  edge: NetworkEdgeResponse
  splitNodes: { node: NetworkNodeResponse; coord: Coordinate; ratio: number }[]
}

export interface TopologyNormalizationResult {
  nodesToCreate: Array<{
    geom: string
    isConnector: boolean
    indoorRouteId: number
    tempId: string
    coord: Coordinate
  }>
  edgesToCreate: Array<{
    source: number | string
    target: number | string
    cost: number
    reverseCost: number
    geometry: string
    coordinates?: Coordinate[]
    indoorRouteId: number
  }>
  edgesToDelete: number[]
  finalPathCoords: Coordinate[]
  gridLineGeomHex: string
}

/**
 * Chuẩn hóa Topology khi thêm mới 1 GridLine:
 * 1. Nhận diện các điểm cắt giữa đường mới với các Edge hiện có.
 * 2. Tách (split) các Edge hiện có tại điểm giao cắt/đã hút vào.
 * 3. Tạo node mới cho các điểm giao cắt/đỉnh mới chưa có node.
 * 4. Tách đường mới thành các đoạn edge con chuẩn.
 */
export function normalizeTopology(
  drawnCoords: Coordinate[],
  existingNodes: NetworkNodeResponse[],
  existingEdges: NetworkEdgeResponse[],
  indoorRouteId: number,
  isOneWay: boolean
): TopologyNormalizationResult {
  if (drawnCoords.length < 2) {
    throw new Error('Đường đi phải có ít nhất 2 điểm.')
  }

  // Loại bỏ các điểm liên tiếp trùng nhau
  const cleanCoords: Coordinate[] = []
  for (const pt of drawnCoords) {
    if (
      cleanCoords.length === 0 ||
      !isSameCoordinate(cleanCoords[cleanCoords.length - 1], pt, 1e-7)
    ) {
      cleanCoords.push(pt)
    }
  }

  // Danh sách các nodes hiện tại + temporary nodes sẽ tạo
  const allNodes: Array<{ id?: number; tempId?: string; coord: Coordinate }> = existingNodes
    .map((n) => {
      let pt: Coordinate | null = null
      if (
        n.geometry &&
        n.geometry.type === 'Point' &&
        Array.isArray(n.geometry.coordinates) &&
        n.geometry.coordinates.length >= 2
      ) {
        pt = [n.geometry.coordinates[0], n.geometry.coordinates[1]]
      } else if (n.geom) {
        pt = wkbHexToPoint(n.geom)
      }
      return pt ? { id: Number(n.id), coord: pt } : null
    })
    .filter((n): n is { id: number; coord: Coordinate } => n !== null)

  const nodesToCreate: Array<{
    geom: string
    isConnector: boolean
    indoorRouteId: number
    tempId: string
    coord: Coordinate
  }> = []
  const edgesToDeleteSet = new Set<number>()
  const edgesToCreate: Array<{
    source: number | string
    target: number | string
    cost: number
    reverseCost: number
    geometry: string
    coordinates?: Coordinate[]
    indoorRouteId: number
  }> = []

  let tempNodeCounter = 1
  const getOrCreateNode = (coord: Coordinate): { id: number | string; coord: Coordinate } => {
    const existing = allNodes.find((n) => isSameCoordinate(n.coord, coord))
    if (existing) {
      return { id: existing.id ?? existing.tempId!, coord: existing.coord }
    }
    const tempId = `TEMP_NODE_${tempNodeCounter++}`
    const newNode = { tempId, coord }
    allNodes.push(newNode)
    nodesToCreate.push({
      geom: pointToWkbHex(coord[0], coord[1]),
      isConnector: false,
      indoorRouteId,
      tempId,
      coord,
    })
    return { id: tempId, coord }
  }

  // Map lưu thông tin các edge hiện có cần split
  const edgeSplitMap = new Map<
    number,
    {
      edge: NetworkEdgeResponse
      points: Array<{ nodeRef: { id: number | string; coord: Coordinate }; ratio: number }>
    }
  >()

  // 1. Kiểm tra các đoạn của đường mới với các Edge hiện có
  const processedSegments: Coordinate[][] = []
  for (let i = 0; i < cleanCoords.length - 1; i++) {
    const segStart = cleanCoords[i]
    const segEnd = cleanCoords[i + 1]

    // Giao điểm phát hiện trên đoạn segStart -> segEnd
    const segIntersections: Array<{ coord: Coordinate; dist: number }> = []

    for (const edge of existingEdges) {
      const edgeCoords =
        edge.geometry &&
        edge.geometry.type === 'LineString' &&
        Array.isArray(edge.geometry.coordinates) &&
        edge.geometry.coordinates.length >= 2
          ? (edge.geometry.coordinates as Coordinate[])
          : parseWKBHexToCoords(edge.geometryWkb)
      if (edgeCoords.length < 2) continue

      for (let j = 0; j < edgeCoords.length - 1; j++) {
        const e1 = edgeCoords[j]
        const e2 = edgeCoords[j + 1]

        const ix = getLineIntersection(segStart, segEnd, e1, e2)
        if (ix) {
          // Tính tỉ lệ vị trí ix trên segStart -> segEnd
          const dSeg = Math.hypot(segEnd[0] - segStart[0], segEnd[1] - segStart[1])
          const dIx = Math.hypot(ix[0] - segStart[0], ix[1] - segStart[1])
          const ratioSeg = dSeg > 0 ? dIx / dSeg : 0

          segIntersections.push({ coord: ix, dist: ratioSeg })

          // Đánh dấu edge cần split
          const nodeRef = getOrCreateNode(ix)
          const dEdge = Math.hypot(e2[0] - e1[0], e2[1] - e1[1])
          const dIxEdge = Math.hypot(ix[0] - e1[0], ix[1] - e1[1])
          const ratioEdge = dEdge > 0 ? dIxEdge / dEdge : 0

          const edgeId = Number(edge.id)
          if (!edgeSplitMap.has(edgeId)) {
            edgeSplitMap.set(edgeId, { edge, points: [] })
          }
          edgeSplitMap.get(edgeId)!.points.push({ nodeRef, ratio: ratioEdge })
        }
      }
    }

    // Sắp xếp các giao điểm theo thứ tự từ segStart tới segEnd
    segIntersections.sort((a, b) => a.dist - b.dist)

    const subChain: Coordinate[] = [segStart]
    for (const item of segIntersections) {
      if (!isSameCoordinate(subChain[subChain.length - 1], item.coord)) {
        subChain.push(item.coord)
      }
    }
    if (!isSameCoordinate(subChain[subChain.length - 1], segEnd)) {
      subChain.push(segEnd)
    }

    processedSegments.push(subChain)
  }

  // Chuỗi tọa độ đầy đủ của đường mới sau khi chèn tất cả các giao điểm
  const fullPathCoords: Coordinate[] = []
  for (const subChain of processedSegments) {
    for (let i = 0; i < subChain.length; i++) {
      if (
        fullPathCoords.length === 0 ||
        !isSameCoordinate(fullPathCoords[fullPathCoords.length - 1], subChain[i])
      ) {
        fullPathCoords.push(subChain[i])
      }
    }
  }

  // 2. Thực hiện tách các Edge cũ bị cắt ngang
  for (const [edgeId, info] of edgeSplitMap.entries()) {
    const edge = info.edge
    const points = info.points

    const edgeCoords =
      edge.geometry &&
      edge.geometry.type === 'LineString' &&
      Array.isArray(edge.geometry.coordinates) &&
      edge.geometry.coordinates.length >= 2
        ? (edge.geometry.coordinates as Coordinate[])
        : parseWKBHexToCoords(edge.geometryWkb)

    // Tìm hoặc tạo node đầu/cuối của edge
    const sourceNode =
      allNodes.find((n) => Number(n.id) === Number(edge.source)) ||
      (edgeCoords.length >= 2 ? getOrCreateNode(edgeCoords[0]) : null)
    const targetNode =
      allNodes.find((n) => Number(n.id) === Number(edge.target)) ||
      (edgeCoords.length >= 2 ? getOrCreateNode(edgeCoords[edgeCoords.length - 1]) : null)

    const validSplitPoints = points.filter((p) => {
      if (sourceNode && isSameCoordinate(p.nodeRef.coord, sourceNode.coord)) return false
      if (targetNode && isSameCoordinate(p.nodeRef.coord, targetNode.coord)) return false
      return p.ratio > 0.001 && p.ratio < 0.999
    })

    if (validSplitPoints.length > 0) {
      edgesToDeleteSet.add(edgeId)
      validSplitPoints.sort((a, b) => a.ratio - b.ratio)

      const nodeSequence: Array<{ id: number | string; coord: Coordinate }> = []
      if (sourceNode) nodeSequence.push({ id: sourceNode.id!, coord: sourceNode.coord })
      validSplitPoints.forEach((p) => {
        if (
          nodeSequence.length === 0 ||
          !isSameCoordinate(nodeSequence[nodeSequence.length - 1].coord, p.nodeRef.coord)
        ) {
          nodeSequence.push(p.nodeRef)
        }
      })
      if (
        targetNode &&
        (nodeSequence.length === 0 ||
          !isSameCoordinate(nodeSequence[nodeSequence.length - 1].coord, targetNode.coord))
      ) {
        nodeSequence.push({ id: targetNode.id!, coord: targetNode.coord })
      }

      for (let k = 0; k < nodeSequence.length - 1; k++) {
        const u = nodeSequence[k]
        const v = nodeSequence[k + 1]
        if (u.id === v.id || isSameCoordinate(u.coord, v.coord)) continue

        const segmentCoords: Coordinate[] = [u.coord, v.coord]
        const lengthMeters = calcPolylineLengthMeters(segmentCoords)
        const cost = Number((lengthMeters / 1000).toFixed(6))
        const reverseCost =
          edge.reverseCost !== undefined && edge.reverseCost !== null && edge.reverseCost < 0
            ? -1
            : cost

        edgesToCreate.push({
          source: u.id,
          target: v.id,
          cost,
          reverseCost,
          geometry: lineStringToWkbHex(segmentCoords),
          coordinates: segmentCoords,
          indoorRouteId: edge.indoorRouteId ?? indoorRouteId,
        })
      }
    }
  }

  // 3. Tạo các Edge mới cho đường vừa vẽ
  const fullPathNodeRefs: Array<{ id: number | string; coord: Coordinate }> = fullPathCoords.map(
    (c) => getOrCreateNode(c)
  )

  for (let i = 0; i < fullPathNodeRefs.length - 1; i++) {
    const u = fullPathNodeRefs[i]
    const v = fullPathNodeRefs[i + 1]

    if (u.id === v.id || isSameCoordinate(u.coord, v.coord)) continue // Tránh tự lặp

    const segmentCoords: Coordinate[] = [u.coord, v.coord]
    const lengthMeters = calcPolylineLengthMeters(segmentCoords)
    const cost = Number((lengthMeters / 1000).toFixed(6))
    const reverseCost = isOneWay ? -1 : cost

    edgesToCreate.push({
      source: u.id,
      target: v.id,
      cost,
      reverseCost,
      geometry: lineStringToWkbHex(segmentCoords),
      coordinates: segmentCoords,
      indoorRouteId,
    })
  }

  const gridLineGeomHex = lineStringToWkbHex(fullPathCoords)

  return {
    nodesToCreate,
    edgesToCreate,
    edgesToDelete: Array.from(edgesToDeleteSet),
    finalPathCoords: fullPathCoords,
    gridLineGeomHex,
  }
}

export interface BatchTopologyInputLine {
  coords: Coordinate[]
  category?: GridlineType
  isOneWay?: boolean
}

export interface BatchTopologyResult {
  nodesToCreate: Array<{
    geom: string
    isConnector: boolean
    indoorRouteId: number
    tempId: string
    coord: Coordinate
  }>
  edgesToCreate: Array<{
    source: number | string
    target: number | string
    cost: number
    reverseCost: number
    geometry: string
    coordinates?: Coordinate[]
    indoorRouteId: number
  }>
  edgesToDelete: number[]
  gridLinesToCreate: Array<{
    category: GridlineType
    isOneWay: boolean
    indoorRouteId: number
    coordinates: Coordinate[]
  }>
  totalOriginalLines: number
}

/**
 * Chuẩn hóa Topology hàng loạt (Batch) cho nhiều đường (từ tập tin GeoJSON)
 * 1. Phân hóa giao cắt giữa các đường mới với nhau và với Edge DB hiện có
 * 2. Tách Edge tại điểm giao cắt
 * 3. Hợp nhất các đỉnh (Node) gần nhau theo COORD_TOLERANCE
 * 4. Tạo đồ thị mạng lưới cạnh (Edge) và dữ liệu GridLine chuẩn hóa
 */
export function normalizeTopologyBatch(
  polylines: BatchTopologyInputLine[],
  existingNodes: NetworkNodeResponse[],
  existingEdges: NetworkEdgeResponse[],
  indoorRouteId: number,
  defaultIsOneWay: boolean,
  defaultCategory: GridlineType = GridlineType.CORRIDOR
): BatchTopologyResult {
  // 1. Khởi tạo danh sách các nodes hiện tại + temporary nodes sẽ tạo
  const allNodes: Array<{ id: number | string; coord: Coordinate }> = existingNodes
    .map((n) => {
      let pt: Coordinate | null = null
      if (
        n.geometry &&
        n.geometry.type === 'Point' &&
        Array.isArray(n.geometry.coordinates) &&
        n.geometry.coordinates.length >= 2
      ) {
        pt = [n.geometry.coordinates[0], n.geometry.coordinates[1]]
      } else if (n.geom) {
        pt = wkbHexToPoint(n.geom)
      }
      return pt ? { id: Number(n.id), coord: pt } : null
    })
    .filter((n): n is { id: number; coord: Coordinate } => n !== null)

  const nodesToCreate: Array<{
    geom: string
    isConnector: boolean
    indoorRouteId: number
    tempId: string
    coord: Coordinate
  }> = []

  let tempNodeCounter = 1
  const getOrCreateNode = (coord: Coordinate): { id: number | string; coord: Coordinate } => {
    const existing = allNodes.find((n) => isSameCoordinate(n.coord, coord))
    if (existing) {
      return existing
    }
    const tempId = `TEMP_NODE_${tempNodeCounter++}`
    const newNode = { id: tempId, coord }
    allNodes.push(newNode)
    nodesToCreate.push({
      geom: pointToWkbHex(coord[0], coord[1]),
      isConnector: false,
      indoorRouteId,
      tempId,
      coord,
    })
    return newNode
  }

  // 2. Quản lý danh sách các edge hiện tại trong bộ nhớ (bao gồm edge DB và edge mới tạo)
  interface ActiveEdge {
    id: number | string
    dbId?: number
    isDbEdge: boolean
    source: number | string
    target: number | string
    coords: Coordinate[]
    cost: number
    reverseCost: number
    indoorRouteId: number
    deleted?: boolean
    splits?: Array<{ coord: Coordinate; ratio: number }>
  }

  let tempEdgeCounter = 1
  const currentEdges: ActiveEdge[] = []

  // Nạp existingEdges từ DB vào currentEdges
  for (const e of existingEdges) {
    const eCoords =
      e.geometry &&
      e.geometry.type === 'LineString' &&
      Array.isArray(e.geometry.coordinates) &&
      e.geometry.coordinates.length >= 2
        ? (e.geometry.coordinates as Coordinate[])
        : parseWKBHexToCoords(e.geometryWkb)
    if (eCoords.length >= 2) {
      currentEdges.push({
        id: Number(e.id),
        dbId: Number(e.id),
        isDbEdge: true,
        source: Number(e.source),
        target: Number(e.target),
        coords: eCoords,
        cost: e.cost,
        reverseCost: e.reverseCost,
        indoorRouteId: e.indoorRouteId ?? indoorRouteId,
      })
    }
  }

  const edgesToDeleteSet = new Set<number>()
  const gridLinesToCreate: BatchTopologyResult['gridLinesToCreate'] = []

  // 3. Chuẩn hóa từng polyline trong danh sách
  for (const lineItem of polylines) {
    const rawCoords = lineItem.coords
    const cleanCoords: Coordinate[] = []
    for (const pt of rawCoords) {
      if (
        cleanCoords.length === 0 ||
        !isSameCoordinate(cleanCoords[cleanCoords.length - 1], pt, 1e-7)
      ) {
        cleanCoords.push(pt)
      }
    }
    if (cleanCoords.length < 2) continue

    const lineCategory = lineItem.category || defaultCategory
    const lineOneWay = lineItem.isOneWay !== undefined ? lineItem.isOneWay : defaultIsOneWay

    // Tìm giao điểm giữa từng đoạn của polyline này với các edge đang active trong currentEdges
    const processedSegments: Coordinate[][] = []

    for (let i = 0; i < cleanCoords.length - 1; i++) {
      const segStart = cleanCoords[i]
      const segEnd = cleanCoords[i + 1]
      const segIntersections: Array<{ coord: Coordinate; dist: number }> = []

      for (const edge of currentEdges) {
        if (edge.deleted) continue
        const eCoords = edge.coords

        for (let j = 0; j < eCoords.length - 1; j++) {
          const e1 = eCoords[j]
          const e2 = eCoords[j + 1]

          const ix = getLineIntersection(segStart, segEnd, e1, e2)
          if (ix) {
            const dSeg = Math.hypot(segEnd[0] - segStart[0], segEnd[1] - segStart[1])
            const dIx = Math.hypot(ix[0] - segStart[0], ix[1] - segStart[1])
            const ratioSeg = dSeg > 0 ? dIx / dSeg : 0
            segIntersections.push({ coord: ix, dist: ratioSeg })

            // Kiểm tra tỉ lệ trên edge
            const dEdge = Math.hypot(e2[0] - e1[0], e2[1] - e1[1])
            const dIxEdge = Math.hypot(ix[0] - e1[0], ix[1] - e1[1])
            const ratioEdge = dEdge > 0 ? dIxEdge / dEdge : 0

            // Nếu giao điểm nằm giữa 2 đầu đoạn edge
            if (ratioEdge > 0.001 && ratioEdge < 0.999) {
              edge.splits = edge.splits || []
              edge.splits.push({ coord: ix, ratio: ratioEdge })
            }
          }
        }
      }

      segIntersections.sort((a, b) => a.dist - b.dist)
      const subChain: Coordinate[] = [segStart]
      for (const item of segIntersections) {
        if (!isSameCoordinate(subChain[subChain.length - 1], item.coord)) {
          subChain.push(item.coord)
        }
      }
      if (!isSameCoordinate(subChain[subChain.length - 1], segEnd)) {
        subChain.push(segEnd)
      }
      processedSegments.push(subChain)
    }

    // Tách các edge trong currentEdges bị cắt ngang
    const newEdgesFromSplits: ActiveEdge[] = []
    for (const edge of currentEdges) {
      if (edge.deleted || !edge.splits || edge.splits.length === 0) continue

      edge.deleted = true
      if (edge.isDbEdge && edge.dbId) {
        edgesToDeleteSet.add(edge.dbId)
      }

      const sortedSplits = edge.splits.sort((a, b) => a.ratio - b.ratio)
      const startNode =
        allNodes.find((n) => String(n.id) === String(edge.source)) ||
        getOrCreateNode(edge.coords[0])
      const targetNode =
        allNodes.find((n) => String(n.id) === String(edge.target)) ||
        getOrCreateNode(edge.coords[edge.coords.length - 1])

      const nodeSeq: Array<{ id: number | string; coord: Coordinate }> = [
        { id: startNode.id, coord: startNode.coord },
      ]
      for (const sp of sortedSplits) {
        const nd = getOrCreateNode(sp.coord)
        if (!isSameCoordinate(nodeSeq[nodeSeq.length - 1].coord, nd.coord)) {
          nodeSeq.push({ id: nd.id, coord: nd.coord })
        }
      }
      if (!isSameCoordinate(nodeSeq[nodeSeq.length - 1].coord, targetNode.coord)) {
        nodeSeq.push({ id: targetNode.id, coord: targetNode.coord })
      }

      for (let k = 0; k < nodeSeq.length - 1; k++) {
        const u = nodeSeq[k]
        const v = nodeSeq[k + 1]
        if (u.id === v.id || isSameCoordinate(u.coord, v.coord)) continue

        const segCoords: Coordinate[] = [u.coord, v.coord]
        const lengthMeters = calcPolylineLengthMeters(segCoords)
        const cost = Number((lengthMeters / 1000).toFixed(6))
        const reverseCost = edge.reverseCost < 0 ? -1 : cost

        newEdgesFromSplits.push({
          id: `TEMP_EDGE_${tempEdgeCounter++}`,
          isDbEdge: false,
          source: u.id,
          target: v.id,
          coords: segCoords,
          cost,
          reverseCost,
          indoorRouteId: edge.indoorRouteId,
        })
      }
    }
    currentEdges.push(...newEdgesFromSplits)

    // Tạo chuỗi tọa độ đầy đủ cho đường mới
    const fullPathCoords: Coordinate[] = []
    for (const subChain of processedSegments) {
      for (let p = 0; p < subChain.length; p++) {
        if (
          fullPathCoords.length === 0 ||
          !isSameCoordinate(fullPathCoords[fullPathCoords.length - 1], subChain[p])
        ) {
          fullPathCoords.push(subChain[p])
        }
      }
    }

    if (fullPathCoords.length >= 2) {
      gridLinesToCreate.push({
        category: lineCategory,
        isOneWay: lineOneWay,
        indoorRouteId,
        coordinates: fullPathCoords,
      })

      // Tạo các edge mới cho polyline này
      const pathNodes = fullPathCoords.map((c) => getOrCreateNode(c))
      for (let k = 0; k < pathNodes.length - 1; k++) {
        const u = pathNodes[k]
        const v = pathNodes[k + 1]
        if (u.id === v.id || isSameCoordinate(u.coord, v.coord)) continue

        const exists = currentEdges.some(
          (e) =>
            !e.deleted &&
            ((e.source === u.id && e.target === v.id) ||
              (!lineOneWay && e.source === v.id && e.target === u.id))
        )
        if (!exists) {
          const segCoords: Coordinate[] = [u.coord, v.coord]
          const lengthMeters = calcPolylineLengthMeters(segCoords)
          const cost = Number((lengthMeters / 1000).toFixed(6))
          const reverseCost = lineOneWay ? -1 : cost

          currentEdges.push({
            id: `TEMP_EDGE_${tempEdgeCounter++}`,
            isDbEdge: false,
            source: u.id,
            target: v.id,
            coords: segCoords,
            cost,
            reverseCost,
            indoorRouteId,
          })
        }
      }
    }
  }

  // Thu thập danh sách edgesToCreate: các edge mới và chưa bị delete
  const edgesToCreate = currentEdges
    .filter((e) => !e.isDbEdge && !e.deleted)
    .map((e) => ({
      source: e.source,
      target: e.target,
      cost: e.cost,
      reverseCost: e.reverseCost,
      geometry: lineStringToWkbHex(e.coords),
      coordinates: e.coords,
      indoorRouteId: e.indoorRouteId,
    }))

  return {
    nodesToCreate,
    edgesToCreate,
    edgesToDelete: Array.from(edgesToDeleteSet),
    gridLinesToCreate,
    totalOriginalLines: polylines.length,
  }
}
