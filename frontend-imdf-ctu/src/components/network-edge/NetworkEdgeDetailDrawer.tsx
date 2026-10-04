import { Drawer, Descriptions, Button, Space, Tag, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined, NodeIndexOutlined, SwapRightOutlined } from '@ant-design/icons'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import { wkbHexToLineString } from '../../utils/wkbParser'

interface NetworkEdgeDetailDrawerProps {
  open: boolean
  onClose: () => void
  edge: NetworkEdgeResponse | null
  nodes: NetworkNodeResponse[]
  onEdit: (edge: NetworkEdgeResponse) => void
  onDelete: (id: number) => Promise<void>
  deleting?: boolean
}

export default function NetworkEdgeDetailDrawer({
  open, onClose, edge, nodes, onEdit, onDelete, deleting
}: NetworkEdgeDetailDrawerProps) {
  if (!edge) return null

  const coords = wkbHexToLineString(edge.geometry)
  const sourceNode = nodes.find((n) => n.id === edge.source)
  const targetNode = nodes.find((n) => n.id === edge.target)

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <NodeIndexOutlined className="text-indigo-600" />
          <span className="font-semibold text-gray-800">Chi tiết Network Edge</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
            #{edge.id}
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
            onClick={() => { onClose(); onEdit(edge) }}
          >
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa Edge này?"
            onConfirm={async () => { await onDelete(edge.id); onClose() }}
            okText="Xóa" cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleting}>Xóa</Button>
          </Popconfirm>
        </Space>
      }
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Tag color="geekblue" className="text-sm">Edge #{edge.id}</Tag>
            <span className="font-bold text-indigo-900 flex items-center gap-1">
              Node #{edge.source} <SwapRightOutlined className="text-indigo-400" /> Node #{edge.target}
            </span>
          </div>
          <p className="text-sm text-indigo-700">
            Tuyến: <span className="font-semibold">{edge.indoorRouteName}</span>
          </p>
        </div>

        <Descriptions
          title={<span className="text-sm font-semibold text-gray-700">Thông tin kỹ thuật</span>}
          bordered column={1} size="middle"
          labelStyle={{ width: '160px', backgroundColor: '#f8fafc', fontWeight: 500 }}
        >
          <Descriptions.Item label="ID Edge">
            <span className="font-semibold">#{edge.id}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Source Node">
            <span className="font-medium text-emerald-700">
              #{edge.source}
              {sourceNode && <span className="text-gray-400 text-xs ml-1">({sourceNode.isConnector ? 'Connector' : 'Thường'})</span>}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Target Node">
            <span className="font-medium text-emerald-700">
              #{edge.target}
              {targetNode && <span className="text-gray-400 text-xs ml-1">({targetNode.isConnector ? 'Connector' : 'Thường'})</span>}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Cost (chiều đi)">
            <code className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {edge.cost}
            </code>
          </Descriptions.Item>

          <Descriptions.Item label="Reverse Cost">
            <code className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {edge.reverseCost}
            </code>
          </Descriptions.Item>

          <Descriptions.Item label="Số điểm geometry">
            <span className="font-medium">{coords.length} điểm</span>
          </Descriptions.Item>

          {coords.length > 0 && (
            <Descriptions.Item label="Tọa độ (trích)">
              <div className="space-y-1 max-h-32 overflow-auto">
                {coords.slice(0, 5).map((c, i) => (
                  <div key={i} className="font-mono text-xs text-gray-600">
                    [{i}] lat={c[1].toFixed(7)}, lng={c[0].toFixed(7)}
                  </div>
                ))}
                {coords.length > 5 && (
                  <div className="text-xs text-gray-400 italic">...và {coords.length - 5} điểm nữa</div>
                )}
              </div>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="WKB Hex (geom)">
            <code className="text-[10px] font-mono text-gray-500 break-all bg-gray-50 p-1 rounded border border-gray-200">
              {edge.geometry.substring(0, 60)}...
            </code>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Drawer>
  )
}
