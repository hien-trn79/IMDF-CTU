export interface LayerType {
  id: string
  layerName: string // Tên layer trên GeoServer (ví dụ: 'imdf_ctu:ctu_buildings_4326')
  to: string // Đường dẫn đến file GeoJSON (ví dụ: '/geojson/ctu_buildings_4326.geojson')
}
