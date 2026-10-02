import { Table, Button, Space, Tooltip, Popconfirm, Empty, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  AimOutlined,
} from '@ant-design/icons'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import { wkbHexToPoint } from '../../utils/wkbParser'

interface NetworkNodeTableProps {
  nodes: NetworkNodeResponse[]
  loading: boolean
  selectedId: number | null
  onView: (node: NetworkNodeResponse) => void
  onEdit: (node: NetworkNodeResponse) => void
  onDelete: (id: number) => Promise<void>
  deletingId: number | null
  onOpenCreate: () => void
}

export default function NetworkNodeTable({
  nodes,
  loading,
  selectedId,
  onView,
  onEdit,
  onDelete,
  deletingId,
  onOpenCreate,
}: NetworkNodeTableProps) {
  const columns: ColumnsType<NetworkNodeResponse> = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
      render: (id: number) => (
        <span
          className={`font-semibold ${id === selectedId ? 'text-emerald-600' : 'text-gray-700'}`}
        >
          #{id}
        </span>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'isConnector',
      key: 'isConnector',
      width: 110,
      filters: [
        { text: 'Connector', value: true },
        { text: 'Thường', value: false },
      ],
      onFilter: (value, record) => record.isConnector === value,
      render: (v: boolean | null) => (
        <Tag color={v ? 'blue' : 'default'} className="text-xs">
          {v ? 'Connector' : 'Thường'}
        </Tag>
      ),
    },
    {
      title: 'Tọa độ (Lat, Lng)',
      key: 'geom',
      render: (_, record) => {
        const coords = wkbHexToPoint(record.geom)
        if (!coords) return <span className="text-gray-400 text-xs italic">Không có</span>
        return (
          <span className="font-mono text-xs text-gray-700">
            {coords[1].toFixed(6)}, {coords[0].toFixed(6)}
          </span>
        )
      },
    },
    {
      title: 'Tuyến đường',
      dataIndex: 'indoorRouteName',
      key: 'indoorRouteName',
      width: 220,
      render: (text: string) => (
        <span className="text-gray-600 text-sm whitespace-normal break-words">{text}</span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onView(record)
              }}
              className="text-gray-600 hover:bg-gray-50"
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(record)
              }}
              className="text-amber-600 hover:bg-amber-50"
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa Network Node?"
              description="Các Edge liên quan có thể bị ảnh hưởng."
              onConfirm={() => onDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: deletingId === record.id }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
                onClick={(e) => e.stopPropagation()}
                className="hover:bg-red-50"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
        <AimOutlined className="text-emerald-600" />
        <span className="text-sm font-semibold text-gray-700">
          Danh sách Network Node — click hàng để xem chi tiết / highlight trên Map
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <Table<NetworkNodeResponse>
          columns={columns}
          dataSource={nodes}
          rowKey="id"
          loading={loading}
          scroll={{ x: 760 }}
          size="middle"
          rowClassName={(record) =>
            record.id === selectedId
              ? 'bg-emerald-50 border-l-4 border-emerald-500 transition-colors cursor-pointer'
              : 'border-l-4 border-transparent transition-colors hover:bg-gray-50/80 cursor-pointer'
          }
          onRow={(record) => ({ onClick: () => onView(record) })}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Tổng số: ${total} node`,
            className: 'px-4 !mb-2 mt-2',
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="py-4 text-center">
                    <p className="text-sm font-medium text-gray-500">Chưa có Network Node</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Thêm node đầu tiên.</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={onOpenCreate}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      Thêm Node
                    </Button>
                  </div>
                }
              />
            ),
          }}
        />
      </div>
    </div>
  )
}
