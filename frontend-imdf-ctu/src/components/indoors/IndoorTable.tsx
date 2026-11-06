import { useEffect, useMemo, useState } from 'react'
import { Button, ConfigProvider, Popconfirm, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ChevronDown, ChevronUp, Crosshair, Edit3, FileText, Trash2 } from 'lucide-react'

// Cùng hình dạng với OutdoorFeatureItem nên dùng chung được FeatureDetailModal.
// `feature` giữ nguyên cả geometry của GeoJSON feature (modal cần để vẽ bản đồ).
export interface IndoorFeatureItem {
  feature: {
    id: string | number
    properties: Record<string, any>
    [key: string]: any
  }
  layer: {
    id: string
    layerName: string
  }
  index: number
}

interface IndoorTableProps {
  features?: IndoorFeatureItem[]
  loading?: boolean
  selectedFeature?: IndoorFeatureItem | null
  onSelectFeature?: (item: IndoorFeatureItem) => void
  onOpenDetailModal?: (item: IndoorFeatureItem | null) => void
  onEditFeature?: (item: IndoorFeatureItem) => void
  onDeleteFeature?: (item: IndoorFeatureItem) => void
}

interface RowData {
  key: string
  stt: number
  layerName: string
  properties: Record<string, any>
  item: IndoorFeatureItem
}

const ROW_HEIGHT = 30
const VISIBLE_ROWS = 4
const PAGE_SIZE_OPTIONS = [4, 10, 25, 50]

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

const EMPTY_FEATURES: IndoorFeatureItem[] = []

export default function IndoorTable({
  features = EMPTY_FEATURES,
  loading = false,
  selectedFeature = null,
  onSelectFeature,
  onOpenDetailModal,
  onEditFeature,
  onDeleteFeature,
}: IndoorTableProps) {
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(VISIBLE_ROWS)
  const [collapsed, setCollapsed] = useState(false)

  // Về trang 1 khi dữ liệu thay đổi (bật/tắt layer)
  useEffect(() => {
    setCurrent(1)
  }, [features.length])

  useEffect(() => {
    if (!selectedFeature) return
    const selectedIndex = features.findIndex(
      (item) =>
        item.layer.id === selectedFeature.layer.id &&
        item.index === selectedFeature.index
    )
    if (selectedIndex >= 0) {
      setCurrent(Math.floor(selectedIndex / pageSize) + 1)
    }
  }, [features, pageSize, selectedFeature])

  const isSelected = (item: IndoorFeatureItem) =>
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
      { title: '#', dataIndex: 'stt', key: 'stt', width: 52, className: 'qgis-gutter' },
      { title: 'Layer', dataIndex: 'layerName', key: 'layer', width: 150, ellipsis: true },
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
        width: 150,
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
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<Edit3 className="h-3.5 w-3.5" />}
                onClick={() => onEditFeature?.(record.item)}
              />
            </Tooltip>
            <Popconfirm
              title="Xóa đối tượng này?"
              description="Thao tác không thể hoàn tác."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDeleteFeature?.(record.item)}
            >
              <Tooltip title="Xoá">
                <Button type="text" size="small" danger icon={<Trash2 className="h-3.5 w-3.5" />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ]
  }, [dynamicKeys, onSelectFeature, onOpenDetailModal, onEditFeature, onDeleteFeature])

  return (
    <section className="outdoor_table qgis-table overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
      <style>{QGIS_TABLE_CSS}</style>

      <div
        className={`flex h-9 items-center justify-between bg-slate-100 px-3 ${
          collapsed ? '' : 'border-b border-slate-300'
        }`}
      >
        <span className="truncate text-xs font-semibold text-slate-700">
          Danh sách chi tiết (Indoor) — Tổng: {features.length}, Đã chọn: {selectedCount}
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
                <span className="text-slate-400">Hãy bật layer ở thanh bên để xem dữ liệu</span>
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
