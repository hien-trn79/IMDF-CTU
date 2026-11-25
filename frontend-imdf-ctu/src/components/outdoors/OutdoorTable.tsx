import { useEffect, useMemo, useState } from 'react'
import { Button, ConfigProvider, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ChevronDown, ChevronUp, Crosshair, Edit3, FileText, Trash2 } from 'lucide-react'
import { getLayerLabel } from './outdoorTypes'

export interface OutdoorFeatureItem {
  feature: {
    id: string
    properties: Record<string, any>
    geometry: GeoJSON.Geometry
  }
  layer: {
    id: string
    layerName: string
  }
  index: number
}

interface OutdoorTableProps {
  features?: OutdoorFeatureItem[]
  loading?: boolean
  emptyMessage?: string
  // Feature đang được chọn (để tô sáng dòng giống QGIS)
  selectedFeature?: OutdoorFeatureItem | null
  // Click dòng hoặc nút "Xem trên bản đồ"
  onSelectFeature?: (item: OutdoorFeatureItem) => void
  // Double-click dòng hoặc nút "Chi tiết"
  onOpenDetailModal?: (item: OutdoorFeatureItem | null) => void
  onEditFeature?: (item: OutdoorFeatureItem) => void
  onDeleteFeature?: (item: OutdoorFeatureItem) => void
}

interface RowData {
  key: string
  stt: number
  layerName: string
  properties: Record<string, any>
  item: OutdoorFeatureItem
}

// Chiều cao một dòng (size small + cellPaddingBlockSM 5 + font 12) và số dòng hiển thị cùng lúc
const ROW_HEIGHT = 30
const VISIBLE_ROWS = 4
const PAGE_SIZE_OPTIONS = [4, 10, 25, 50]

// Giao diện lấy cảm hứng từ bảng thuộc tính của QGIS: zebra, dòng chọn màu xanh, cột số thứ tự xám
const QGIS_TABLE_CSS = `
.qgis-table .ant-table-tbody > tr.ant-table-row > td { cursor: pointer; }
.qgis-table .ant-table-tbody > tr.qgis-row-alt > td { background: #f8fafc; }
.qgis-table .ant-table-tbody > tr.qgis-row-selected > td,
.qgis-table .ant-table-tbody > tr.qgis-row-selected:hover > td { background: #bfdbfe !important; }
.qgis-table td.qgis-gutter,
.qgis-table th.qgis-gutter {
  background: #f1f5f9 !important;
  color: #64748b;
  text-align: center !important;
  font-weight: 500;
}
.qgis-table .ant-table-tbody > tr.qgis-row-selected > td.qgis-gutter {
  background: #93c5fd !important;
  color: #1e3a8a;
}
.qgis-table .ant-table-thead > tr > th { font-weight: 600; }
`

const EMPTY_FEATURES: OutdoorFeatureItem[] = []

export default function OutdoorTable({
  features = EMPTY_FEATURES,
  loading = false,
  emptyMessage,
  selectedFeature = null,
  onSelectFeature,
  onOpenDetailModal,
  onEditFeature,
  onDeleteFeature,
}: OutdoorTableProps) {
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(VISIBLE_ROWS)
  const [collapsed, setCollapsed] = useState(false)

  // Về trang 1 khi dữ liệu thay đổi (bật/tắt layer)
  useEffect(() => {
    setCurrent(1)
  }, [features.length])

  const isSelected = (item: OutdoorFeatureItem) =>
    !!selectedFeature &&
    selectedFeature.layer.id === item.layer.id &&
    selectedFeature.index === item.index

  const selectedCount = features.some(isSelected) ? 1 : 0

  const dataSource = useMemo<RowData[]>(
    () =>
      features.map((item) => ({
        key: `${item.layer.id}-${item.feature.id ?? item.index}-${item.index}`,
        stt: item.index + 1,
        layerName: item.layer.layerName,
        properties: item.feature.properties || {},
        item,
      })),
    [features]
  )

  // Tự động lấy tối đa 5 thuộc tính làm cột động
  const dynamicKeys = useMemo(
    () =>
      Array.from(new Set(features.flatMap((f) => Object.keys(f.feature.properties || {})))).slice(
        0,
        5
      ),
    [features]
  )

  const columns = useMemo<ColumnsType<RowData>>(() => {
    const keys = dynamicKeys.length > 0 ? dynamicKeys : ['id', 'name', 'type']

    return [
      {
        title: '#',
        dataIndex: 'stt',
        key: 'stt',
        width: 52,
        className: 'qgis-gutter',
      },
      {
        title: 'Layer',
        dataIndex: 'layerName',
        key: 'layer',
        width: 150,
        ellipsis: true,
        render: (layerName: string) => getLayerLabel(layerName),
      },
      ...keys.map((key) => ({
        title: <span className="capitalize">{key.replace(/_/g, ' ')}</span>,
        key,
        width: 150,
        ellipsis: { showTitle: false },
        render: (_: unknown, record: RowData) => {
          const value = record.properties?.[key]
          const text = value !== undefined && value !== null ? String(value) : '—'
          return (
            <Tooltip placement="topLeft" title={text}>
              <span>{text}</span>
            </Tooltip>
          )
        },
      })),
      {
        title: 'Trạng thái',
        key: 'status',
        width: 96,
        render: () => (
          <Tag color="success" style={{ margin: 0 }}>
            Active
          </Tag>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 136,
        fixed: 'right',
        render: (_: unknown, record: RowData) => (
          <Space size={2} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Xem trên bản đồ">
              <Button
                type="text"
                size="small"
                icon={<Crosshair className="h-3.5 w-3.5" />}
                onClick={() => onSelectFeature?.(record.item)}
              />
            </Tooltip>
            <Tooltip title="Chi tiết">
              <Button
                type="text"
                size="small"
                icon={<FileText className="h-3.5 w-3.5" />}
                onClick={() => onOpenDetailModal?.(record.item)}
              />
            </Tooltip>
            <Tooltip
              title={
                record.item.layer.id === 'api-anchors'
                  ? 'Chỉnh sửa Anchor'
                  : record.item.layer.id === 'api-amenities'
                    ? 'Chỉnh sửa Amenity'
                    : record.item.layer.id === 'api-level'
                      ? 'Chỉnh sửa Level'
                      : 'Chỉnh sửa Unit'
              }
            >
              <Button
                type="text"
                size="small"
                icon={<Edit3 className="h-3.5 w-3.5" />}
                onClick={() => onEditFeature?.(record.item)}
                aria-label={
                  record.item.layer.id === 'api-anchors'
                    ? 'Chỉnh sửa Anchor'
                    : record.item.layer.id === 'api-amenities'
                      ? 'Chỉnh sửa Amenity'
                      : record.item.layer.id === 'api-level'
                        ? 'Chỉnh sửa Level'
                        : 'Chỉnh sửa Unit'
                }
              />
            </Tooltip>
            <Tooltip
              title={
                record.item.layer.id === 'api-anchors'
                  ? 'Xóa Anchor'
                  : record.item.layer.id === 'api-amenities'
                    ? 'Xóa Amenity'
                    : 'Xóa Unit'
              }
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 className="h-3.5 w-3.5" />}
                aria-label={
                  record.item.layer.id === 'api-anchors'
                    ? 'Xóa Anchor'
                    : record.item.layer.id === 'api-amenities'
                      ? 'Xóa Amenity'
                      : 'Xóa Unit'
                }
                onClick={() => onDeleteFeature?.(record.item)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ]
  }, [dynamicKeys, onSelectFeature, onOpenDetailModal, onEditFeature, onDeleteFeature])

  return (
    <section className="outdoor_table qgis-table overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
      <style>{QGIS_TABLE_CSS}</style>

      {/* THANH TIÊU ĐỀ KIỂU QGIS */}
      <div
        className={`flex h-9 items-center justify-between bg-slate-100 px-3 ${
          collapsed ? '' : 'border-b border-slate-300'
        }`}
      >
        <span className="truncate text-xs font-semibold text-slate-700">
          Danh sách chi tiết — Tổng: {features.length}
          {features.length === 0 ? ' (Chưa cài đặt hoặc không tìm thấy bảng)' : `, Đã chọn: ${selectedCount}`}
        </span>
        <Tooltip title={collapsed ? 'Mở rộng bảng' : 'Thu gọn bảng'}>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Mở rộng bảng' : 'Thu gọn bảng'}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800"
          >
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </Tooltip>
      </div>

      {!collapsed && (
        <ConfigProvider
          theme={{
            token: { fontSize: 12, borderRadius: 4 },
            components: {
              Table: {
                headerBg: '#f1f5f9',
                headerColor: '#334155',
                headerSplitColor: '#cbd5e1',
                borderColor: '#cbd5e1',
                rowHoverBg: '#e0f2fe',
                cellPaddingBlockSM: 5,
                cellPaddingInlineSM: 8,
              },
            },
          }}
        >
          <Table<RowData>
            size="small"
            bordered
            loading={loading}
            columns={columns}
            dataSource={dataSource}
            scroll={{ x: 'max-content', y: ROW_HEIGHT * VISIBLE_ROWS }}
            rowClassName={(record, idx) =>
              [
                idx % 2 === 1 ? 'qgis-row-alt' : '',
                isSelected(record.item) ? 'qgis-row-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
            onRow={(record) => ({
              onClick: () => onSelectFeature?.(record.item),
              onDoubleClick: () => onOpenDetailModal?.(record.item),
            })}
            locale={{
              emptyText: (
                <span className="text-slate-400 font-medium py-3 block">
                  {emptyMessage || 'Chưa có dữ liệu trong layer đang chọn'}
                </span>
              ),
            }}
            pagination={{
              current,
              pageSize,
              total: dataSource.length,
              size: 'small',
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              hideOnSinglePage: dataSource.length <= PAGE_SIZE_OPTIONS[0],
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
              style: { margin: '6px 12px' },
              onChange: (page, size) => {
                setCurrent(size !== pageSize ? 1 : page)
                setPageSize(size)
              },
            }}
          />
        </ConfigProvider>
      )}
    </section>
  )
}
