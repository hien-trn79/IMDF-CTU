import { useEffect, useState } from 'react'
import { Descriptions, Modal } from 'antd'
import { LandPlot } from 'lucide-react'
import { useUser } from '../../../context/UserContext'
import type { AddressResponse } from '../../../model/imdf models/Address.model'
import type { VenueGeojsonItem } from '../../../model/imdf models/Venue.model'

const API_URL = 'http://localhost:8081/api'

// Đếm số đỉnh trong mảng tọa độ GeoJSON lồng nhau
const countPoints = (c: unknown): number => {
  if (!Array.isArray(c)) return 0
  if (typeof c[0] === 'number') return 1
  return c.reduce((sum: number, item: unknown) => sum + countPoints(item), 0)
}

// Địa chỉ đầy đủ trên một dòng, bỏ qua phần trống
const buildFullAddress = (a: AddressResponse) =>
  [a.unit, a.address, a.locality, a.province, a.country]
    .filter((part) => part && part.trim())
    .join(', ')

interface Props {
  open: boolean
  venue: VenueGeojsonItem | null
  onClose: () => void
  /** Gọi sau khi đóng modal (dùng để xóa venue đang chọn ở component cha) */
  afterClose?: () => void
}

export default function VenueDetailModal({ open, venue, onClose, afterClose }: Props) {
  const { token } = useUser()
  const properties = venue?.properties
  const geometry = venue?.geometry
  const addressId = properties?.addressId

  // Địa chỉ đầy đủ lấy từ API theo addressId của địa điểm
  const [fullAddress, setFullAddress] = useState<string | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)

  useEffect(() => {
    // Chỉ truy vấn khi modal đang mở và địa điểm có addressId
    if (!open || !token || addressId === undefined || addressId === null) {
      setFullAddress(null)
      setAddressLoading(false)
      return
    }

    const controller = new AbortController()
    setFullAddress(null)
    setAddressLoading(true)

    fetch(`${API_URL}/addresses/${addressId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi ${res.status}`)
        return res.json() as Promise<AddressResponse>
      })
      .then((data) => {
        if (!controller.signal.aborted) setFullAddress(buildFullAddress(data))
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        console.error('Lỗi tải địa chỉ:', err)
        setFullAddress(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setAddressLoading(false)
      })

    return () => controller.abort()
  }, [open, token, addressId])

  // Nếu không tải được địa chỉ đầy đủ thì dùng tên địa chỉ có sẵn trong dữ liệu địa điểm
  const addressText = addressLoading
    ? 'Đang tải địa chỉ...'
    : fullAddress || properties?.addressName || '—'

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={afterClose}
      footer={null}
      centered
      width={760}
      zIndex={4000} // cao hơn header (z-3000)
      destroyOnHidden
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <LandPlot size={18} />
          <span className="font-bold uppercase">Chi tiết địa điểm</span>
          {properties?.venueName && (
            <span className="text-xs font-normal normal-case text-slate-500">
              — {properties.venueName}
            </span>
          )}
        </div>
      }
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      {venue && properties && (
        <div className="space-y-5 pt-2">
          <Descriptions
            title="Thông tin chung"
            size="small"
            bordered
            column={{ xs: 1, sm: 2 }}
            labelStyle={{ fontWeight: 600, width: 170 }}
            items={[
              { key: 'id', label: 'ID Địa điểm', children: venue.id },
              { key: 'name', label: 'Tên địa điểm', children: properties.venueName || '—' },
              {
                key: 'cateId',
                label: 'Mã Loại địa điểm',
                children: properties.venueCategoryId ?? '—',
              },
              {
                key: 'cateName',
                label: 'Tên Loại địa điểm',
                children: properties.venueCategoryName || '—',
              },
              {
                key: 'restrId',
                label: 'ID Loại hạn chế',
                children: properties.restrictionCategoryId ?? '—',
              },
              {
                key: 'restrName',
                label: 'Tên Loại hạn chế',
                children: properties.restricttionCategoryName || '—',
              },
              {
                key: 'featureType',
                label: 'Loại feature',
                children: properties.featureType || '—',
              },
              { key: 'addressId', label: 'ID Địa chỉ', children: properties.addressId ?? '—' },
              {
                key: 'venueUuid',
                label: 'Venue UUID',
                span: 2,
                children: <span className="font-mono text-xs">{properties.venueId || '—'}</span>,
              },
              {
                key: 'featureUuid',
                label: 'Feature UUID',
                span: 2,
                children: <span className="font-mono text-xs">{properties.featureId || '—'}</span>,
              },
              {
                key: 'address',
                label: 'Địa chỉ',
                span: 2,
                children: addressText,
              },
            ]}
          />

          <Descriptions
            title="Hình học"
            size="small"
            bordered
            column={{ xs: 1, sm: 2 }}
            labelStyle={{ fontWeight: 600, width: 170 }}
            items={[
              { key: 'type', label: 'Loại Geometry', children: geometry?.type ?? '—' },
              { key: 'points', label: 'Số đỉnh', children: countPoints(geometry?.coordinates) },
            ]}
          />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Tọa độ (GeoJSON)</h4>
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-300">
              {JSON.stringify(geometry?.coordinates, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  )
}
