import { Table, Button, Space, Tooltip, Popconfirm, Empty, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  NodeIndexOutlined,
  SwapRightOutlined,
} from '@ant-design/icons'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'

interface NetworkEdgeTableProps {
  edges: NetworkEdgeResponse[]
  loading: boolean
  selectedId: number | null
  onView: (edge: NetworkEdgeResponse) => void
  onEdit: (edge: NetworkEdgeResponse) => void
  onDelete: (id: number) => Promise<void>
  deletingId: number | null
  onOpenCreate: () => void
}

export default function NetworkEdgeTable({
  edges,
  loading,
  selectedId,
  onView,
  onEdit,
  onDelete,
  deletingId,
  onOpenCreate,
}: NetworkEdgeTableProps) {
  const columns: ColumnsType<NetworkEdgeResponse> = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      sorter: (a, b) => a.id - b.id,
      render: (id: number) => (
        <span
          className={`font-semibold ${id === selectedId ? 'text-indigo-600' : 'text-gray-700'}`}
        >
          #{id}
        </span>
      ),
    },
    {
      title: 'Source → Target',
      key: 'route',
      width: 140,
      render: (_, record) => (
        <span className="flex items-center gap-1 font-mono text-sm">
          <Tag color="green" className="!mr-0 text-xs">
            #{record.source}
          </Tag>
          <SwapRightOutlined className="text-gray-400" />
          <Tag color="blue" className="!mr-0 text-xs">
            #{record.target}
          </Tag>
        </span>
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 90,
      sorter: (a, b) => a.cost - b.cost,
      render: (v: number) => (
        <code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
          {v}
        </code>
      ),
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
              title="Xóa Network Edge?"
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
        <NodeIndexOutlined className="text-indigo-600" />
        <span className="text-sm font-semibold text-gray-700">
          Danh sách Network Edge — click hàng để xem chi tiết / highlight trên Map
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <Table<NetworkEdgeResponse>
          columns={columns}
          dataSource={edges}
          rowKey="id"
          loading={loading}
          scroll={{ x: 760 }}
          size="middle"
          rowClassName={(record) =>
            record.id === selectedId
              ? 'bg-indigo-50 border-l-4 border-indigo-500 transition-colors cursor-pointer'
              : 'border-l-4 border-transparent transition-colors hover:bg-gray-50/80 cursor-pointer'
          }
          onRow={(record) => ({ onClick: () => onView(record) })}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Tổng số: ${total} edge`,
            className: 'px-4 !mb-2 mt-2',
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="py-4 text-center">
                    <p className="text-sm font-medium text-gray-500">Chưa có Network Edge</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={onOpenCreate}
                      className="bg-indigo-600 hover:bg-indigo-500 mt-3"
                    >
                      Thêm Edge
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
