import { Drawer, Descriptions, Button, Space, Tooltip, message, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined, CopyOutlined, CheckOutlined, CalendarOutlined } from '@ant-design/icons'
import { useState } from 'react'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'

interface IndoorRouteDetailDrawerProps {
  open: boolean
  onClose: () => void
  route: IndoorRouteResponse | null
  onEdit: (route: IndoorRouteResponse) => void
  onDelete: (id: number) => Promise<void>
  deleting?: boolean
}

export default function IndoorRouteDetailDrawer({
  open, onClose, route, onEdit, onDelete, deleting
}: IndoorRouteDetailDrawerProps) {
  const [copied, setCopied] = useState(false)

  if (!route) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(route.indoorRouteId)
    setCopied(true)
    message.success('Đã sao chép UUID')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">Chi tiết Tuyến đường</span>
          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-mono">
            #{route.id}
          </span>
        </div>
      }
      placement="right"
      width={460}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => { onClose(); onEdit(route) }}
          >
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa Tuyến đường này?"
            onConfirm={async () => { await onDelete(route.id); onClose() }}
            okText="Xóa" cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleting}>Xóa</Button>
          </Popconfirm>
        </Space>
      }
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-5 rounded-xl border border-sky-100 shadow-sm">
          <h2 className="text-xl font-bold text-sky-900 mb-1">{route.indoorRouteName}</h2>
          <p className="text-sm text-sky-700/80 mb-3 flex items-center gap-1.5">
            <CalendarOutlined /> 
            Tạo lúc: {new Date(route.createdAt).toLocaleString('vi-VN')}
          </p>
          <p className="text-sm text-gray-600 bg-white/60 p-3 rounded-lg border border-sky-100/50 min-h-[60px]">
            {route.description || <span className="italic text-gray-400">Chưa có mô tả chi tiết...</span>}
          </p>
        </div>

        <Descriptions
          title={<span className="text-sm font-semibold text-gray-700">Thông tin kỹ thuật</span>}
          bordered column={1} size="middle"
          labelStyle={{ width: '140px', backgroundColor: '#f8fafc', fontWeight: 500 }}
        >
          <Descriptions.Item label="Mã số (ID)">
            <span className="font-semibold text-gray-800">#{route.id}</span>
          </Descriptions.Item>

          <Descriptions.Item label="UUID định danh">
            <div className="flex items-center gap-1.5">
              <code className="text-[11px] font-mono text-gray-700 bg-gray-50 p-1 rounded border border-gray-200 break-all">
                {route.indoorRouteId}
              </code>
              <Tooltip title={copied ? 'Đã sao chép!' : 'Sao chép'}>
                <Button size="small" type="text"
                  icon={copied ? <CheckOutlined className="text-emerald-500" /> : <CopyOutlined />}
                  onClick={handleCopy}
                />
              </Tooltip>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Nút bắt đầu">
            {route.startNodeId ? (
              <span className="font-medium">Nút #{route.startNodeId}</span>
            ) : (
              <span className="text-gray-400 italic">Chưa xác định</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Nút kết thúc">
            {route.endNodeId ? (
              <span className="font-medium">Nút #{route.endNodeId}</span>
            ) : (
              <span className="text-gray-400 italic">Chưa xác định</span>
            )}
          </Descriptions.Item>
          
          <Descriptions.Item label="Cập nhật lần cuối">
             {new Date(route.updatedAt).toLocaleString('vi-VN')}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Drawer>
  )
}
