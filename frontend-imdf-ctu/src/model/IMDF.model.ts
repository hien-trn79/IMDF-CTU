import type { Feature, Geometry } from 'geojson'

export type IMDFFeatureType =
  | 'unit'
  | 'building'
  | 'level'
  | 'opening'
  | 'door'
  | 'fixture'
  | 'footprint'
  | 'anchor'
  | 'venue'

export type DrawingGeometryMode = 'none' | 'polygon' | 'multipolygon' | 'linestring' | 'point'

export interface IMDFProperties {
  id: string
  feature_type: IMDFFeatureType
  name?: string
  alt_name?: string
  level_id?: number | string
  category?: string
  restriction?: string
  accessibility?: string[]
  display_point?: [number, number]
  area_sqm?: number
  length_meters?: number
  vertex_count?: number
  is_valid?: boolean
  normalized_at?: string
  [key: string]: any
}

export interface IMDFFeatureItem {
  feature: Feature<Geometry, IMDFProperties>
  layerId?: string
  isDraft?: boolean
  isSelected?: boolean
}

export interface IMDFNormalizeRequest {
  featureType: IMDFFeatureType
  geometry: {
    type: string
    coordinates: any
  }
  displayPoint?: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties?: Record<string, any>
  simplifyTolerance?: number
}

export interface IMDFNormalizeResponse {
  valid: boolean
  message: string
  featureType: string
  geometry: {
    type: string
    coordinates: any
  }
  displayPoint?: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: IMDFProperties
  bbox: [number, number, number, number]
  areaSqm: number
  lengthMeters: number
  vertexCount: number
  geometryType: string
}

export interface SysPublishedLayer {
  layerId: number
  layerName: string
  displayName: string
  workspace: string
  geometryType: string
  srid: number
  tableName: string
  isPublished: boolean
  description?: string
  styleName?: string
  serviceType?: string
  wmsUrl?: string
  wfsUrl?: string
  mvtUrl?: string
  levelId?: number
  createdAt?: string
  updateAt?: string
}

export interface PublishLayerFormData {
  tableName: string
  displayName: string
  workspace: string
  description: string
  srid: number
  styleName: string
  serviceTypes: ('WMS' | 'WFS' | 'MVT')[]
  levelId?: number
}
