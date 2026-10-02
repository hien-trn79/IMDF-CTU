import { Drawer, Descriptions, Button, Space, Tag, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined, AimOutlined, LinkOutlined } from '@ant-design/icons'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import { wkbHexToPoint } from '../../utils/wkbParser'

interface NetworkNodeDetailDrawerProps {
  open: boolean
  onClose: () => void
  node: NetworkNodeResponse | null
  onEdit: (node: NetworkNodeResponse) => void
  onDelete: (id: number) => Promise<void>
  deleting?: boolean
}

export default function NetworkNodeDetailDrawer({
  open, onClose, node, onEdit, onDelete, deleting
}: NetworkNodeDetailDrawerProps) {
  if (!node) return null

  const coords = wkbHexToPoint(node.geom)

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <AimOutlined className="text-emerald-600" />
          <span className="font-semibold text-gray-800">Chi tiết Network Node</span>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-mono">
            #{node.id}
          </span>
        </div>
      }
      placement="right"
      width={440}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => { onClose(); onEdit(node) }}
          >
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa Node này? Các Edge liên quan có thể bị ảnh hưởng."
            onConfirm={async () => { await onDelete(node.id); onClose() }}
            okText="Xóa" cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleting}>Xóa</Button>
          </Popconfirm>
        </Space>
      }
    >
      <div className="space-y-5">
        {/* Header info */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-emerald-900">Node #{node.id}</h2>
            <Tag color={node.isConnector ? 'blue' : 'default'}>
              {node.isConnector ? 'Connector' : 'Thường'}
            </Tag>
          </div>
          <p className="text-sm text-emerald-700 flex items-center gap-1.5">
            <LinkOutlined />
            Tuyến đường: <span className="font-semibold">{node.indoorRouteName}</span>
          </p>
        </div>

        {/* Thông tin tọa độ */}
        <Descriptions
          title={<span className="text-sm font-semibold text-gray-700">Thông tin kỹ thuật</span>}
          bordered column={1} size="middle"
          labelStyle={{ width: '140px', backgroundColor: '#f8fafc', fontWeight: 500 }}
        >
          <Descriptions.Item label="ID Node">
            <span className="font-semibold text-gray-800">#{node.id}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Loại Node">
            <Tag color={node.isConnector ? 'blue' : 'default'}>
              {node.isConnector ? 'Connector (kết nối tầng)' : 'Node thường'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Tuyến đường (ID)">
            <span className="text-gray-700">ID #{node.indoorRouteId} — {node.indoorRouteName}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Vĩ độ (Lat)">
            {coords ? (
              <code className="text-sm font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {coords[1].toFixed(8)}
              </code>
            ) : <span className="text-gray-400 italic">Không parse được</span>}
          </Descriptions.Item>

          <Descriptions.Item label="Kinh độ (Lng)">
            {coords ? (
              <code className="text-sm font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {coords[0].toFixed(8)}
              </code>
            ) : <span className="text-gray-400 italic">Không parse được</span>}
          </Descriptions.Item>

          <Descriptions.Item label="WKB Hex (geom)">
            <code className="text-[10px] font-mono text-gray-500 break-all bg-gray-50 p-1 rounded border border-gray-200">
              {node.geom}
            </code>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Drawer>
  )
}
