import { Table, Tag, Button, Tooltip, Popconfirm, Space, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EyeOutlined, EditOutlined, DeleteOutlined, AimOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons'
import type { GridLineResponse } from '../../model/GridLine.model'
import { calcPolylineLengthMeters, formatLength, parseWKBHexToCoords } from '../../utils/wkbUtils'

interface GridLineTableProps {
  gridLines: GridLineResponse[]
  loading: boolean
  selectedId: number | null
  onView: (gl: GridLineResponse) => void
  onEdit: (gl: GridLineResponse) => void
  onDelete: (id: number) => Promise<void>
  onFlyTo: (gl: GridLineResponse) => void
  deletingId: number | null
  onOpenCreate: () => void
}

export default function GridLineTable({
  gridLines, loading, selectedId, onView, onEdit, onDelete, onFlyTo, deletingId, onOpenCreate
}: GridLineTableProps) {

  const renderCategory = (cat: string) => {
    const colors: Record<string, string> = {
      grid_line: 'blue', corridor: 'cyan', stairs: 'purple',
      elevator: 'magenta', emergency: 'red',
    }
    return <Tag color={colors[cat?.toLowerCase()] ?? 'default'}>{cat}</Tag>
  }

  const columns: ColumnsType<GridLineResponse> = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      sorter: (a, b) => a.id - b.id,
      render: (id: number) => (
        <span className={`font-semibold ${id === selectedId ? 'text-sky-600' : 'text-gray-700'}`}>
          #{id}
        </span>
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: string) => renderCategory(cat),
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: 'Tuyến đường',
      dataIndex: 'indoorRouteName',
      key: 'indoorRouteName',
      ellipsis: true,
      render: (name: string) => (
        <span className="text-sm text-gray-700 truncate">{name}</span>
      ),
    },
    {
      title: 'Chiều',
      dataIndex: 'isOneWay',
      key: 'isOneWay',
      width: 95,
      render: (v: boolean) => (
        <Tag color={v ? 'orange' : 'green'} icon={<SwapOutlined />}>
          {v ? 'Một chiều' : 'Hai chiều'}
        </Tag>
      ),
    },
    {
      title: 'Dài (m)',
      key: 'length',
      width: 90,
      render: (_, record) => {
        const coords = parseWKBHexToCoords(record.geom)
        const len = calcPolylineLengthMeters(coords)
        return <span className="text-xs font-mono text-gray-600">{formatLength(len)}</span>
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Định vị trên bản đồ">
            <Button
              type="text" size="small"
              icon={<AimOutlined />}
              onClick={() => onFlyTo(record)}
              className="text-sky-500 hover:bg-sky-50"
            />
          </Tooltip>
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
              title="Xóa GridLine này?"
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
    <Table<GridLineResponse>
      columns={columns}
      dataSource={gridLines}
      rowKey="id"
      loading={loading}
      scroll={{ x: 640 }}
      size="small"
      rowClassName={(record) =>
        record.id === selectedId ? 'bg-sky-50 border-l-2 border-sky-500' : ''
      }
      pagination={{
        defaultPageSize: 8,
        showSizeChanger: true,
        pageSizeOptions: ['8', '15', '30', '50'],
        showTotal: (total) => `${total} đường lưới`,
        size: 'small',
      }}
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="py-2 text-center">
                <p className="text-sm font-medium text-gray-500">Chưa có dữ liệu GridLine</p>
                <p className="text-xs text-gray-400 mt-1">Tạo đường lưới đầu tiên cho tuyến đường.</p>
              </div>
            }
          >
            <Button type="primary" size="small" icon={<PlusOutlined />}
              onClick={onOpenCreate} className="bg-sky-600 hover:bg-sky-500">
              Thêm GridLine
            </Button>
          </Empty>
        ),
      }}
    />
  )
}
