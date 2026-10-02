import { Table, Button, Space, Tooltip, Popconfirm, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'

interface IndoorRouteTableProps {
  routes: IndoorRouteResponse[]
  loading: boolean
  selectedId: number | null
  onView: (route: IndoorRouteResponse) => void
  onEdit: (route: IndoorRouteResponse) => void
  onDelete: (id: number) => Promise<void>
  deletingId: number | null
  onOpenCreate: () => void
}

export default function IndoorRouteTable({
  routes, loading, selectedId, onView, onEdit, onDelete, deletingId, onOpenCreate
}: IndoorRouteTableProps) {

  const columns: ColumnsType<IndoorRouteResponse> = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
      render: (id: number) => (
        <span className={`font-semibold ${id === selectedId ? 'text-sky-600' : 'text-gray-700'}`}>
          #{id}
        </span>
      ),
    },
    {
      title: 'Tên Tuyến đường',
      dataIndex: 'indoorRouteName',
      key: 'indoorRouteName',
      ellipsis: true,
      sorter: (a, b) => a.indoorRouteName.localeCompare(b.indoorRouteName),
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <span className="text-gray-500 text-sm">{text || <span className="italic text-gray-400">Không có</span>}</span>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (dateStr: string) => {
        if (!dateStr) return '-'
        return <span className="text-xs text-gray-500">{new Date(dateStr).toLocaleDateString('vi-VN')}</span>
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text" size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              className="text-gray-600 hover:bg-gray-50"
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text" size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              className="text-amber-600 hover:bg-amber-50"
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa Tuyến đường này?"
              description="Các GridLine thuộc tuyến này có thể bị ảnh hưởng."
              onConfirm={() => onDelete(record.id)}
              okText="Xóa" cancelText="Hủy"
              okButtonProps={{ danger: true, loading: deletingId === record.id }}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />}
                loading={deletingId === record.id}
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
        <InfoCircleOutlined className="text-sky-600" />
        <span className="text-sm font-semibold text-gray-700">
          Danh sách Tuyến đường — click hàng để xem chi tiết
        </span>
      </div>
      
      <div className="flex-1 overflow-auto">
        <Table<IndoorRouteResponse>
          columns={columns}
          dataSource={routes}
          rowKey="id"
          loading={loading}
          scroll={{ x: 600 }}
          size="middle"
          rowClassName={(record) =>
            record.id === selectedId ? 'bg-sky-50 border-l-4 border-sky-500 transition-colors' : 'border-l-4 border-transparent transition-colors hover:bg-gray-50/80 cursor-pointer'
          }
          onRow={(record) => ({
            onClick: () => onView(record)
          })}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng số: ${total} tuyến đường`,
            className: 'px-4 !mb-2 mt-2',
          }}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="py-4 text-center">
                    <p className="text-sm font-medium text-gray-500">Chưa có dữ liệu Indoor Route</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Tạo tuyến đường nội khu đầu tiên của bạn.</p>
                    <Button type="primary" icon={<PlusOutlined />}
                      onClick={onOpenCreate} className="bg-sky-600 hover:bg-sky-500">
                      Thêm Tuyến đường
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
