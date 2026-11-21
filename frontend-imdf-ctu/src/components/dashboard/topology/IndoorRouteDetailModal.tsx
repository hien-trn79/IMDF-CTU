import { Descriptions, Modal, Tag } from 'antd'
import { Route } from 'lucide-react'
import type { TopologyResponse } from '../../../model/route models/Topology.model'

interface Props {
  open: boolean
  route: TopologyResponse | null
  venueName: string
  buildingName: string
  levelName: string
  onClose: () => void
  afterClose?: () => void
}

// Nhãn không xuống dòng, độ rộng cố định; nội dung tự xuống dòng khi quá dài thay vì bị bóp chữ
const labelStyle = { fontWeight: 600, width: 130, whiteSpace: 'nowrap' as const }
const contentStyle = { wordBreak: 'break-word' as const }

export default function IndoorRouteDetailModal({
  open,
  route,
  venueName,
  buildingName,
  levelName,
  onClose,
  afterClose,
}: Props) {
  const isActive = route?.status?.toUpperCase() === 'ACTIVE'

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={afterClose}
      footer={null}
      centered
      width={720}
      zIndex={4000} // cao hơn header (z-3000)
      destroyOnHidden
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <Route size={18} />
          <span className="font-bold uppercase">Chi tiết đường đi</span>
        </div>
      }
    >
      {route && (
        <div className="flex flex-col gap-6 pt-2">
          {/* Tên đường đi nổi bật ở đầu, không bị ép vào cột hẹp */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Tên đường đi
              </p>
              <p className="mb-0 break-words text-base font-bold text-slate-800">
                {route.indoorRouteName || '—'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {route.indoorRouteType && (
                <Tag color="blue" className="m-0">
                  {route.indoorRouteType}
                </Tag>
              )}
              {route.status && (
                <Tag color={isActive ? 'success' : 'default'} className="m-0">
                  {route.status}
                </Tag>
              )}
            </div>
          </div>

          <Descriptions
            title="Thông tin chung"
            size="small"
            bordered
            column={2}
            labelStyle={labelStyle}
            contentStyle={contentStyle}
            items={[
              { key: 'id', label: 'ID', children: route.id },
              { key: 'levelId', label: 'ID Tầng', children: route.levelId },
              { key: 'type', label: 'Loại đường đi', children: route.indoorRouteType || '—' },
              { key: 'status', label: 'Trạng thái', children: route.status || '—' },
              { key: 'ordinal', label: 'Thứ tự tầng', span: 2, children: route.ordinal ?? '—' },
              {
                key: 'uuid',
                label: 'Route UUID',
                span: 2,
                children: <span className="font-mono text-xs">{route.indoorRouteId || '—'}</span>,
              },
            ]}
          />

          <Descriptions
            title="Vị trí"
            size="small"
            bordered
            column={1}
            labelStyle={labelStyle}
            contentStyle={contentStyle}
            items={[
              { key: 'venue', label: 'Địa điểm', children: venueName || '—' },
              { key: 'building', label: 'Tòa nhà', children: buildingName || '—' },
              { key: 'level', label: 'Tầng', children: levelName || '—' },
            ]}
          />
        </div>
      )}
    </Modal>
  )
}
