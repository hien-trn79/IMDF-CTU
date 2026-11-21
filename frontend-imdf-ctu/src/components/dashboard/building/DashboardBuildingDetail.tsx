import { Descriptions, Modal } from 'antd'
import { Building2 } from 'lucide-react'
import type { useBuildings } from './useBuildings'
import { useEffect, useState } from 'react'
import type { AddressResponse } from '../../../model/imdf models/Address.model'
import { useUser } from '../../../context/UserContext'

type Building = NonNullable<ReturnType<typeof useBuildings>['buildings']>[number]

// Đếm số đỉnh trong mảng tọa độ GeoJSON lồng nhau
const countPoints = (c: unknown): number => {
  if (!Array.isArray(c)) return 0
  if (typeof c[0] === 'number') return 1
  return c.reduce((sum: number, item: unknown) => sum + countPoints(item), 0)
}

interface Props {
  open: boolean
  building: Building | null
  onClose: () => void
  afterClose?: () => void
}

export default function DashboardBuildingDetail({ open, building, onClose, afterClose }: Props) {
  const properties = building?.properties
  const geometry = building?.geometry
  const display = properties?.displayPoint?.coordinates

  console.log('DashboardBuildingDetail building:', building)

  // Lấy dũ liệu về địa chỉ của tòa nhà từ API, nếu có addressId
  const [address, setAddress] = useState<string | null>(null)

  const { token } = useUser()

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/addresses/${properties?.addressId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (!response.ok) throw new Error(`Lỗi ${response.status}`)
        const data: AddressResponse = await response.json()
        // Địa chỉ đầy đủ trên một dòng, bỏ qua phần trống
        const fullAddress = [data.unit, data.address, data.locality, data.province, data.country]
          .filter((part) => part && part.trim())
          .join(', ')
        setAddress(fullAddress)
      } catch (error) {
        console.error('Lỗi tải địa chỉ:', error)
        setAddress(null)
      }
    }
    fetchAddress()
  }, [properties?.addressId])

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={afterClose}
      footer={null}
      centered
      width={760}
      destroyOnHidden
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <Building2 size={18} />
          <span className="font-bold uppercase">Chi tiết tòa nhà</span>
          {properties?.buildingName && (
            <span className="text-xs font-normal normal-case text-slate-500">
              — {properties.buildingName}
            </span>
          )}
        </div>
      }
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      {building && properties && (
        <div className="space-y-5 pt-2">
          <Descriptions
            title="Thông tin chung"
            size="small"
            bordered
            column={{ xs: 1, sm: 2 }}
            labelStyle={{ fontWeight: 600, width: 170 }}
            items={[
              { key: 'id', label: 'ID Tòa nhà', children: building.id },
              { key: 'name', label: 'Tên tòa nhà', children: properties.buildingName || '—' },
              {
                key: 'cateId',
                label: 'Mã Loại tòa nhà',
                children: properties.buildingCategoryId || '—',
              },
              {
                key: 'cateName',
                label: 'Tên Loại tòa nhà',
                children: properties.buildingCategoryName || '—',
              },

              { key: 'venueId', label: 'ID Địa điểm', children: properties.venueId },
              {
                key: 'venueName',
                label: 'Tên địa điểm',
                children: properties.venueName || '—',
              },
              {
                key: 'restr',
                label: 'ID Loại hạn chế',
                children: properties.restrictionCategoryId ?? '—',
              },

              {
                key: 'restrName',
                label: 'Tên Loại hạn chế',
                children: properties.restrictionCategoryName ?? '—',
              },
              {
                key: 'uuid',
                label: 'Feature UUID',
                span: 2,
                children: <span className="font-mono text-xs">{properties.featureId}</span>,
              },
              {
                key: 'address',
                label: 'Địa chỉ',
                span: 2,
                children: address || '—',
              },
            ]}
          />

          <Descriptions
            title="Vị trí"
            size="small"
            bordered
            column={{ xs: 1, sm: 2 }}
            labelStyle={{ fontWeight: 600, width: 170 }}
            items={[
              {
                key: 'display',
                label: 'Điểm hiển thị (kinh độ, vĩ độ)',
                span: 2,
                children: display ? `${display[0]}, ${display[1]}` : '—',
              },
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
