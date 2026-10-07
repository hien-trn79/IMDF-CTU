import { useEffect, useMemo } from 'react'
import { Collapse, Descriptions, Modal, Tag } from 'antd'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getLayerLabel } from './outdoorTypes'

interface FeatureDetailModalProps {
  data: any | null // Feature được chọn từ bảng OutdoorTable
  onClose: () => void
  isOpenSelectedFeatureModal: boolean
}

// Đếm tổng số đỉnh (vertex) của geometry, hỗ trợ mọi kiểu lồng nhau
const countVertices = (coords: any): number => {
  if (!Array.isArray(coords)) return 0
  if (typeof coords[0] === 'number') return 1
  return coords.reduce((sum: number, c: any) => sum + countVertices(c), 0)
}

// Zoom bản đồ vừa khít đối tượng. Modal có animation mở nên phải invalidateSize trước
function FitToFeature({ feature }: { feature: any }) {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
      const bounds = L.geoJSON(feature).getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 20 })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [map, feature])

  return null
}

export default function FeatureDetailModal({
  data,
  onClose,
  isOpenSelectedFeatureModal,
}: FeatureDetailModalProps) {
  const feature = data?.feature
  const layer = data?.layer
  const properties = feature?.properties || {}
  const geometry = feature?.geometry

  // Thông tin hình học: kiểu, số đỉnh, tâm
  const geometryInfo = useMemo(() => {
    if (!geometry) return null
    const bounds = L.geoJSON(geometry).getBounds()
    const center = bounds.isValid() ? bounds.getCenter() : null
    return {
      type: geometry.type as string,
      vertices: countVertices(geometry.coordinates),
      center,
    }
  }, [geometry])

  if (!data || !feature) return null

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-lg font-bold text-slate-800">Chi tiết đối tượng</span>
          <Tag color="blue" style={{ margin: 0 }}>
            {getLayerLabel(layer?.layerName || '')}
          </Tag>
        </div>
      }
      open={isOpenSelectedFeatureModal}
      onCancel={onClose}
      footer={null}
      width="min(1000px, 95vw)"
      centered
      destroyOnHidden
    >
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* BÊN TRÁI: THUỘC TÍNH + HÌNH HỌC */}
        <div className="flex min-w-0 flex-col gap-4 md:max-h-[70vh] md:overflow-y-auto md:pr-1">
          <Descriptions
            title="Thuộc tính"
            bordered
            size="small"
            column={1}
            styles={{ label: { width: '35%', fontWeight: 600, backgroundColor: '#f8fafc' } }}
          >
            <Descriptions.Item label="Feature ID">
              <span className="font-mono text-slate-600">{feature.id || '—'}</span>
            </Descriptions.Item>
            {Object.entries(properties).map(([key, value]) => (
              <Descriptions.Item
                key={key}
                label={<span className="capitalize">{key.replace(/_/g, ' ')}</span>}
              >
                {value !== null && value !== undefined ? String(value) : '—'}
              </Descriptions.Item>
            ))}
          </Descriptions>

          {geometryInfo && (
            <Descriptions
              title="Hình học"
              bordered
              size="small"
              column={1}
              styles={{ label: { width: '35%', fontWeight: 600, backgroundColor: '#f8fafc' } }}
            >
              <Descriptions.Item label="Kiểu">{geometryInfo.type}</Descriptions.Item>
              <Descriptions.Item label="Số đỉnh">{geometryInfo.vertices}</Descriptions.Item>
              <Descriptions.Item label="Tên cột">{feature.geometry_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Hệ toạ độ">EPSG:4326 (WGS 84)</Descriptions.Item>
              <Descriptions.Item label="Tâm (lat, lng)">
                {geometryInfo.center ? (
                  <span className="font-mono text-slate-600">
                    {geometryInfo.center.lat.toFixed(6)}, {geometryInfo.center.lng.toFixed(6)}
                  </span>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Collapse
            size="small"
            items={[
              {
                key: 'raw-geometry',
                label: 'Toạ độ GeoJSON',
                children: (
                  <pre className="max-h-48 overflow-auto rounded-md bg-slate-50 p-2 font-mono text-[11px] leading-relaxed text-slate-600">
                    {JSON.stringify(geometry, null, 2)}
                  </pre>
                ),
              },
            ]}
          />
        </div>

        {/* BÊN PHẢI: BẢN ĐỒ HÌNH HỌC */}
        <div className="h-72 min-w-0 overflow-hidden rounded-xl border border-slate-200 md:h-auto md:min-h-105">
          <MapContainer
            key={feature.id}
            center={[10.03031, 105.76843]}
            zoom={18}
            maxZoom={22}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              maxNativeZoom={19}
              maxZoom={22}
            />
            <GeoJSON
              data={feature}
              style={{ color: '#2563eb', weight: 3, fillColor: '#2563eb', fillOpacity: 0.35 }}
              pointToLayer={(_f, latlng) =>
                L.circleMarker(latlng, {
                  radius: 8,
                  color: '#2563eb',
                  fillColor: '#2563eb',
                  fillOpacity: 0.8,
                })
              }
            />
            <FitToFeature feature={feature} />
          </MapContainer>
        </div>
      </div>
    </Modal>
  )
}
