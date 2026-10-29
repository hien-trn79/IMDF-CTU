import type { IMDFFeatureItem, SysPublishedLayer } from '../model/IMDF.model'
import { authHeaders } from './authHeaders'

const BASE_URL = '/api'
const GEOSERVER_URL = '/geoserver'
const DEFAULT_WORKSPACE = 'imdf_ctu'

const getAuthToken = (passedToken?: string): string => {
  if (passedToken) return passedToken
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed?.token || ''
    }
  } catch (ignored) {
  }
  return ''
}

export const indoorRestApiService = {
  /**
   * 1. Lấy danh sách Unit từ database qua RestAPI [GET] /api/units (hoặc /api/units?levelId={levelId})
   */
  async fetchUnits(levelId?: number, token?: string): Promise<any[]> {
    const effectiveToken = getAuthToken(token)
    const url = levelId ? `${BASE_URL}/units?levelId=${levelId}` : `${BASE_URL}/units?size=100`

    try {
      const res = await fetch(url, { headers: authHeaders(effectiveToken) })
      if (!res.ok) return []
      const json = await res.json()
      // Nếu là PageResponse
      if (Array.isArray(json)) return json
      if (Array.isArray(json?.content)) return json.content
      return []
    } catch (err) {
      console.warn('Lỗi khi fetch units từ RestAPI:', err)
      return []
    }
  },

  /**
   * 2. Lấy danh sách Level từ database qua RestAPI [GET] /api/levels
   */
  async fetchLevels(token?: string): Promise<any[]> {
    const effectiveToken = getAuthToken(token)
    try {
      const res = await fetch(`${BASE_URL}/levels?size=50`, { headers: authHeaders(effectiveToken) })
      if (!res.ok) return []
      const json = await res.json()
      if (Array.isArray(json)) return json
      if (Array.isArray(json?.content)) return json.content
      return []
    } catch (err) {
      console.warn('Lỗi khi fetch levels từ RestAPI:', err)
      return []
    }
  },

  /**
   * 3. Lấy danh sách Building từ database qua RestAPI [GET] /api/buildings
   */
  async fetchBuildings(token?: string): Promise<any[]> {
    const effectiveToken = getAuthToken(token)
    try {
      const res = await fetch(`${BASE_URL}/buildings?size=50`, { headers: authHeaders(effectiveToken) })
      if (!res.ok) return []
      const json = await res.json()
      if (Array.isArray(json)) return json
      if (Array.isArray(json?.content)) return json.content
      return []
    } catch (err) {
      console.warn('Lỗi khi fetch buildings từ RestAPI:', err)
      return []
    }
  },

  /**
   * 4. Lấy danh sách Openings (Cửa / Lối mở) qua RestAPI [GET] /api/openings
   */
  async fetchOpenings(token?: string): Promise<any[]> {
    const effectiveToken = getAuthToken(token)
    try {
      const res = await fetch(`${BASE_URL}/openings?size=100`, { headers: authHeaders(effectiveToken) })
      if (!res.ok) return []
      const json = await res.json()
      if (Array.isArray(json)) return json
      if (Array.isArray(json?.content)) return json.content
      return []
    } catch (err) {
      console.warn('Lỗi khi fetch openings từ RestAPI:', err)
      return []
    }
  },

  /**
   * 5. Lấy danh sách Anchors (Điểm định vị) qua RestAPI [GET] /api/anchors
   */
  async fetchAnchors(token?: string): Promise<any[]> {
    const effectiveToken = getAuthToken(token)
    try {
      const res = await fetch(`${BASE_URL}/anchors?size=100`, { headers: authHeaders(effectiveToken) })
      if (!res.ok) return []
      const json = await res.json()
      if (Array.isArray(json)) return json
      if (Array.isArray(json?.content)) return json.content
      return []
    } catch (err) {
      console.warn('Lỗi khi fetch anchors từ RestAPI:', err)
      return []
    }
  },

  /**
   * 6. Lấy danh sách Layer thực tế từ GeoServer qua GetCapabilities
   */
  async fetchGeoServerLayers(workspace = DEFAULT_WORKSPACE): Promise<SysPublishedLayer[]> {
    try {
      const res = await fetch(`${GEOSERVER_URL}/${workspace}/wms?service=WMS&request=GetCapabilities`)
      if (!res.ok) return []

      const xmlText = await res.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

      const layerNodes = xmlDoc.querySelectorAll('Capability > Layer > Layer')
      const result: SysPublishedLayer[] = []

      Array.from(layerNodes).forEach((layerNode, idx) => {
        const nameNode = layerNode.querySelector('Name')
        const titleNode = layerNode.querySelector('Title')
        const rawName = nameNode?.textContent || ''
        if (!rawName) return

        const layerName = rawName.includes(':') ? rawName.split(':')[1] : rawName
        const layerWorkspace = rawName.includes(':') ? rawName.split(':')[0] : workspace

        result.push({
          layerId: idx + 1,
          layerName,
          displayName: titleNode?.textContent || layerName,
          workspace: layerWorkspace,
          geometryType: 'MultiPolygon',
          srid: 4326,
          tableName: layerName,
          isPublished: true,
          wmsUrl: `${GEOSERVER_URL}/${layerWorkspace}/wms`,
          wfsUrl: `${GEOSERVER_URL}/${layerWorkspace}/wfs`,
          mvtUrl: `${GEOSERVER_URL}/gwc/service/tms/1.0.0/${layerWorkspace}:${layerName}@EPSG:900913@pbf/{z}/{x}/{-y}.pbf`,
        })
      })

      return result
    } catch (err) {
      console.warn('Lỗi khi đọc GetCapabilities từ GeoServer:', err)
      return []
    }
  },

  /**
   * 7. Lấy dữ liệu Features thực tế từ GeoServer WFS cho các Layer đã xuất bản
   */
  async fetchGeoServerWfsFeatures(layerNames: string[]): Promise<IMDFFeatureItem[]> {
    if (layerNames.length === 0) return []
    try {
      const typeNames = layerNames.join(',')
      const url = `${GEOSERVER_URL}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${typeNames}&outputFormat=application/json`
      const res = await fetch(url)
      if (!res.ok) return []

      const data = await res.json()
      if (!data?.features) return []

      return data.features.map((f: any, idx: number) => {
        const rawId = f.id || String(idx)
        const ftType = rawId.includes('.') ? rawId.split('.')[0] : 'unit'
        return {
          feature: {
            ...f,
            properties: {
              ...f.properties,
              id: rawId,
              name: f.properties?.name || f.properties?.unit_name || rawId,
              feature_type: ftType,
              level_id: f.properties?.level_id || 1,
            },
          },
          layerId: ftType,
        }
      })
    } catch (err) {
      console.warn('Lỗi fetch WFS GeoServer features:', err)
      return []
    }
  },

  /**
   * 8. Tải và tổng hợp toàn bộ dữ liệu Indoor THỰC TẾ từ Database (Unit, Level, Building, Opening, Anchor)
   */
  async loadAllRealIndoorFeatures(levelId?: number, token?: string): Promise<IMDFFeatureItem[]> {
    const [units, buildings, openings, anchors] = await Promise.all([
      this.fetchUnits(levelId, token),
      this.fetchBuildings(token),
      this.fetchOpenings(token),
      this.fetchAnchors(token),
    ])

    const result: IMDFFeatureItem[] = []

    // 1. Ánh xạ Units thực tế từ DB
    units.forEach((u: any) => {
      if (!u.geometry) return
      result.push({
        feature: {
          type: 'Feature',
          id: String(u.id),
          properties: {
            id: String(u.id),
            name: u.unitName || `Phòng ${u.id}`,
            alt_name: u.unitId ? String(u.unitId) : '',
            feature_type: 'unit',
            level_id: u.levelId || 1,
            category: u.unitCategoryName || 'unit',
            restriction: u.restrictionCategoryName || 'public',
            display_point: u.displayPoint?.coordinates,
            vertex_count: u.geometry?.coordinates?.[0]?.[0]?.length || u.geometry?.coordinates?.[0]?.length || 4,
            is_valid: true,
          },
          geometry: u.geometry,
        },
        layerId: 'unit',
      })
    })

    // 2. Ánh xạ Buildings thực tế từ DB
    buildings.forEach((b: any) => {
      if (!b.geometry) return
      result.push({
        feature: {
          type: 'Feature',
          id: `building_${b.id}`,
          properties: {
            id: `building_${b.id}`,
            name: `Tòa nhà #${b.id}`,
            feature_type: 'building',
            level_id: levelId || 1,
            display_point: b.displayPoint?.coordinates,
            is_valid: true,
          },
          geometry: b.geometry,
        },
        layerId: 'building',
      })
    })

    // 3. Ánh xạ Openings thực tế từ DB
    openings.forEach((o: any) => {
      if (!o.geometry) return
      result.push({
        feature: {
          type: 'Feature',
          id: `opening_${o.id}`,
          properties: {
            id: `opening_${o.id}`,
            name: o.openingName || `Lối mở #${o.id}`,
            feature_type: 'opening',
            level_id: o.level || 1,
            category: o.openingCategoryName || 'opening',
            display_point: o.displayPoint?.coordinates,
            is_valid: true,
          },
          geometry: o.geometry,
        },
        layerId: 'opening',
      })
    })

    // 4. Ánh xạ Anchors thực tế từ DB
    anchors.forEach((a: any) => {
      if (!a.geometry) return
      result.push({
        feature: {
          type: 'Feature',
          id: `anchor_${a.id}`,
          properties: {
            id: `anchor_${a.id}`,
            name: a.anchorName || `Điểm định vị #${a.id}`,
            feature_type: 'anchor',
            level_id: a.levelId || 1,
            is_valid: true,
          },
          geometry: a.geometry,
        },
        layerId: 'anchor',
      })
    })

    return result
  },

  /**
   * 9. Lưu đối tượng Unit mới vào cơ sở dữ liệu qua RestAPI [POST] /api/units
   */
  async createUnitInDatabase(
    unitData: {
      unitName: string
      geometry: any
      displayPoint?: any
      levelId: number
      unitCategoryId?: number
      restrictionCategoryId?: number
    },
    token?: string
  ): Promise<any> {
    const effectiveToken = getAuthToken(token)
    const payload = {
      unitName: unitData.unitName,
      geometry: unitData.geometry,
      displayPoint: unitData.displayPoint || {
        type: 'Point',
        coordinates: unitData.geometry.coordinates?.[0]?.[0]?.[0] || [105.7689, 10.0308],
      },
      featureId: null,
      levelId: unitData.levelId || 1,
      unitCategoryId: unitData.unitCategoryId || 1,
      restrictionCategoryId: unitData.restrictionCategoryId || 1,
    }

    const res = await fetch(`${BASE_URL}/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(effectiveToken),
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Tạo Unit thất bại: ${res.status}`)
    }

    return res.json()
  },
}
