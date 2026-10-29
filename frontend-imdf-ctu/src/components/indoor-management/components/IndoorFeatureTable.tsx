import { useMemo, useState } from 'react'
import { Button, ConfigProvider, Popconfirm, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  FileText,
  Trash2,
  CheckCircle2,
  Search,
} from 'lucide-react'
import type { IMDFFeatureItem } from '../../../model/IMDF.model'

interface IndoorFeatureTableProps {
  features: IMDFFeatureItem[]
  selectedFeature: IMDFFeatureItem | null
  onSelectFeature: (item: IMDFFeatureItem) => void
  onDeleteFeature: (id: string) => void
  onOpenDetailModal?: (item: IMDFFeatureItem) => void
}

interface RowData {
  key: string
  stt: number
  id: string
  name: string
  altName: string
  featureType: string
  levelId: number | string
  areaSqm: string
  vertexCount: number | string
  isValid: boolean
  item: IMDFFeatureItem
}

const QGIS_TABLE_CSS = `
.qgis-table .ant-table-tbody > tr.ant-table-row > td { cursor: pointer; }
.qgis-table .ant-table-tbody > tr.qgis-row-alt > td { background: #f8fafc; }
.qgis-table .ant-table-tbody > tr.qgis-row-selected > td,
.qgis-table .ant-table-tbody > tr.qgis-row-selected:hover > td { background: #bfdbfe !important; }
.qgis-table td.qgis-gutter,
.qgis-table th.qgis-gutter {
  background: #f1f5f9 !important;
  color: #64748b;
  text-align: center;
  font-size: 11px;
}
`

export default function IndoorFeatureTable({
  features,
  selectedFeature,
  onSelectFeature,
  onDeleteFeature,
  onOpenDetailModal,
}: IndoorFeatureTableProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')

  const filteredFeatures = useMemo(() => {
    if (!search) return features
    const q = search.toLowerCase()
    return features.filter((f) => {
      const p = f.feature?.properties ?? {}
      return (
        p.name?.toLowerCase().includes(q) ||
        p.alt_name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q)
      )
    })
  }, [features, search])

  const dataSource: RowData[] = useMemo(
    () =>
      filteredFeatures.map((item, idx) => {
        const p = item.feature?.properties ?? {}
        return {
          key: p.id || String(idx),
          stt: idx + 1,
          id: p.id,
          name: p.name || 'Chưa đặt tên',
          altName: p.alt_name || '—',
          featureType: p.feature_type || 'unit',
          levelId: p.level_id || 1,
          areaSqm: p.area_sqm ? `${p.area_sqm.toFixed(1)} m²` : p.length_meters ? `${p.length_meters.toFixed(1)} m` : '—',
          vertexCount: p.vertex_count || item.feature?.geometry?.type || '—',
          isValid: p.is_valid ?? true,
          item,
        }
      }),
    [filteredFeatures]
  )

  const columns: ColumnsType<RowData> = useMemo(
    () => [
      {
        title: '#',
        dataIndex: 'stt',
        key: 'stt',
        width: 44,
        align: 'center',
        className: 'qgis-gutter',
      },
      {
        title: 'Tên đối tượng (Name)',
        dataIndex: 'name',
        key: 'name',
        width: 170,
        ellipsis: true,
        render: (name: string, row: RowData) => (
          <div>
            <span className="font-semibold text-slate-800">{name}</span>
            {row.altName !== '—' && (
              <span className="text-[10px] text-slate-400 block font-mono">{row.altName}</span>
            )}
          </div>
        ),
      },
      {
        title: 'Loại IMDF',
        dataIndex: 'featureType',
        key: 'featureType',
        width: 110,
        render: (ft: string) => (
          <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
            {ft.toUpperCase()}
          </Tag>
        ),
      },
      {
        title: 'Tầng',
        dataIndex: 'levelId',
        key: 'levelId',
        width: 70,
        render: (lvl: number | string) => (
          <span className="font-bold text-slate-600">T{lvl}</span>
        ),
      },
      {
        title: 'Hình học & Kích thước',
        dataIndex: 'areaSqm',
        key: 'areaSqm',
        width: 130,
        render: (area: string, row: RowData) => (
          <div>
            <span className="font-semibold text-emerald-700">{area}</span>
            <span className="text-[10px] text-slate-400 block">({row.vertexCount} đỉnh)</span>
          </div>
        ),
      },
      {
        title: 'ST_MakeValid',
        dataIndex: 'isValid',
        key: 'isValid',
        width: 105,
        render: () => (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hợp lệ</span>
          </span>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 110,
        fixed: 'right',
        render: (_: unknown, record: RowData) => (
          <Space size={2} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Xem trên bản đồ">
              <Button
                type="text"
                size="small"
                icon={<Crosshair className="h-3.5 w-3.5" />}
                onClick={() => onSelectFeature(record.item)}
              />
            </Tooltip>
            {onOpenDetailModal && (
              <Tooltip title="Chi tiết thuộc tính">
                <Button
                  type="text"
                  size="small"
                  icon={<FileText className="h-3.5 w-3.5" />}
                  onClick={() => onOpenDetailModal(record.item)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Xác nhận xóa đối tượng này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDeleteFeature(record.id)}
            >
              <Tooltip title="Xóa">
                <Button type="text" size="small" danger icon={<Trash2 className="h-3.5 w-3.5" />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onSelectFeature, onDeleteFeature, onOpenDetailModal]
  )

  return (
    <section className="outdoor_table qgis-table overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
      <style>{QGIS_TABLE_CSS}</style>

      {/* HEADER BẢNG */}
      <div
        className={`flex h-9 items-center justify-between bg-slate-100 px-3 ${
          collapsed ? '' : 'border-b border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="truncate text-xs font-semibold text-slate-700">
            Bảng thuộc tính đối tượng IMDF — Tổng: {features.length}
          </span>

          {!collapsed && (
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên/mã phòng..."
                className="h-6 w-36 pl-6 pr-2 text-[11px] rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <Tooltip title={collapsed ? 'Mở rộng bảng thuộc tính' : 'Thu gọn bảng'}>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800 cursor-pointer"
          >
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </Tooltip>
      </div>

      {/* TABLE NỘI DUNG */}
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
                cellPaddingBlockSM: 4,
                cellPaddingInlineSM: 6,
              },
            },
          }}
        >
          <Table<RowData>
            size="small"
            columns={columns}
            dataSource={dataSource}
            scroll={{ x: 'max-content', y: 150 }}
            pagination={{
              size: 'small',
              pageSize: 5,
              showSizeChanger: false,
              style: { margin: '4px 8px' },
            }}
            rowClassName={(record) =>
              selectedFeature?.feature?.properties?.id === record.id
                ? 'qgis-row-selected'
                : record.stt % 2 === 0
                  ? 'qgis-row-alt'
                  : ''
            }
            onRow={(record) => ({
              onClick: () => onSelectFeature(record.item),
            })}
          />
        </ConfigProvider>
      )}
    </section>
  )
}
