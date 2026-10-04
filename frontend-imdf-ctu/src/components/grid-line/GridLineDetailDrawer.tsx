import { Drawer, Descriptions, Tag, Button, Space, Tooltip, message, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined, CopyOutlined, CheckOutlined, InfoCircleOutlined, SwapOutlined } from '@ant-design/icons'
import { useState } from 'react'
import type { GridLineResponse } from '../../model/GridLine.model'
import { calcPolylineLengthMeters, formatLength, parseWKBHexToCoords } from '../../utils/wkbUtils'

interface GridLineDetailDrawerProps {
  open: boolean
  onClose: () => void
  gridLine: GridLineResponse | null
  onEdit: (gl: GridLineResponse) => void
  onDelete: (id: number) => Promise<void>
  deleting?: boolean
}

export default function GridLineDetailDrawer({
  open, onClose, gridLine, onEdit, onDelete, deleting
}: GridLineDetailDrawerProps) {
  const [copied, setCopied] = useState(false)

  if (!gridLine) return null

  const coords = parseWKBHexToCoords(gridLine.geom)
  const length = calcPolylineLengthMeters(coords)

  const handleCopy = () => {
    navigator.clipboard.writeText(gridLine.gridLineId)
    setCopied(true)
    message.success('Đã sao chép UUID')
    setTimeout(() => setCopied(false), 2000)
  }

  const renderCategory = (cat: string) => {
    const colors: Record<string, string> = {
      grid_line: 'blue',
      corridor: 'cyan',
      stairs: 'purple',
      elevator: 'magenta',
      emergency: 'red',
    }
    return <Tag color={colors[cat?.toLowerCase()] ?? 'default'}>{cat}</Tag>
  }

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">Chi tiết đường lưới nội khu</span>
          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-mono">
            #{gridLine.id}
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
            onClick={() => { onClose(); onEdit(gridLine) }}
          >
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa GridLine này?"
            onConfirm={async () => { await onDelete(gridLine.id); onClose() }}
            okText="Xóa" cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleting}>Xóa</Button>
          </Popconfirm>
        </Space>
      }
    >
      <div className="space-y-5">
        {/* Header card */}
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-4 rounded-xl border border-sky-100">
          <div className="flex items-center gap-2 mb-2">
            {renderCategory(gridLine.category)}
            <Tag color={gridLine.isOneWay ? 'orange' : 'green'} icon={<SwapOutlined />}>
              {gridLine.isOneWay ? 'Một chiều' : 'Hai chiều'}
            </Tag>
          </div>
          <p className="text-sm text-gray-600">
            Thuộc tuyến: <span className="font-semibold text-sky-800">{gridLine.indoorRouteName}</span>
          </p>
        </div>

        <Descriptions
          title={<span className="text-sm font-semibold text-gray-700">Thông tin kỹ thuật</span>}
          bordered column={1} size="middle"
        >
          <Descriptions.Item label="Mã số (ID)">
            <span className="font-semibold">#{gridLine.id}</span>
          </Descriptions.Item>

          <Descriptions.Item label="UUID định danh">
            <div className="flex items-center gap-1.5">
              <code className="text-[11px] font-mono text-gray-700 bg-gray-50 p-1 rounded border border-gray-200 break-all">
                {gridLine.gridLineId}
              </code>
              <Tooltip title={copied ? 'Đã sao chép!' : 'Sao chép'}>
                <Button size="small" type="text"
                  icon={copied ? <CheckOutlined className="text-emerald-500" /> : <CopyOutlined />}
                  onClick={handleCopy}
                />
              </Tooltip>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Phân loại">
            {renderCategory(gridLine.category)}
          </Descriptions.Item>

          <Descriptions.Item label="Chiều lưu thông">
            <Tag color={gridLine.isOneWay ? 'orange' : 'green'}>
              {gridLine.isOneWay ? 'Một chiều' : 'Hai chiều'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Số điểm tọa độ">
            <span className="font-semibold">{coords.length} điểm</span>
          </Descriptions.Item>

          <Descriptions.Item label="Chiều dài ước tính">
            <span className="font-semibold text-sky-700">{formatLength(length)}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Tuyến đường (Route)">
            #{gridLine.indoorRouteId} – {gridLine.indoorRouteName}
          </Descriptions.Item>
        </Descriptions>

        {/* Coordinates preview */}
        {coords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Tọa độ (lng, lat) — {coords.length} điểm
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 max-h-40 overflow-y-auto font-mono text-[11px] space-y-1">
              {coords.map(([lng, lat], i) => (
                <div key={i} className="flex gap-3 text-gray-600">
                  <span className="text-gray-400 w-5">{i + 1}.</span>
                  <span>{lng.toFixed(8)}, {lat.toFixed(8)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-start gap-2">
          <InfoCircleOutlined className="text-sky-600 mt-0.5 shrink-0" />
          <span>
            Geometry được lưu dưới dạng WKB Hex (BigEndian, EPSG:4326). Tọa độ hiển thị là (Kinh độ, Vĩ độ).
          </span>
        </div>
      </div>
    </Drawer>
  )
}
