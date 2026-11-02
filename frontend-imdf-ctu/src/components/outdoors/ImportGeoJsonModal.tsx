import { Modal, Progress } from 'antd'
import { Tag } from 'lucide-react'

interface ImportGeoJsonModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  confirmImport: () => void
  isImporting: boolean
  selectedTable: string
  setSelectedTable: (table: string) => void
  importFileName: string
  importFeatures: any[]
  duplicateCount: number
  importProgress: number
  selectedLevelOrdinal: number | undefined
}

export default function ImportGeoJsonModal({
  open,
  setOpen,
  confirmImport,
  isImporting,
  selectedTable,
  setSelectedTable,
  importFileName,
  importFeatures,
  duplicateCount,
  importProgress,
  selectedLevelOrdinal,
}: ImportGeoJsonModalProps) {
  return (
    <Modal
      title="Thêm dữ liệu từ GeoJSON"
      open={open}
      onCancel={() => !isImporting && setOpen(false)}
      onOk={confirmImport}
      okText={isImporting ? 'Đang xử lý...' : 'Bắt đầu thêm dữ liệu'}
      cancelText="Hủy"
      confirmLoading={isImporting}
      closable={!isImporting}
      maskClosable={!isImporting}
      centered
    >
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Bảng lưu dữ liệu
          <select
            value={selectedTable}
            onChange={(event) => setSelectedTable(event.target.value)}
            disabled={isImporting}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            <option value="anchors">Anchor - Điểm neo</option>
            <option value="amenities">Amenity - Tiện ích</option>
            <option value="unit">Unit - Phòng</option>
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-500">
            File GeoJSON sẽ được chuyển thành bản ghi trong bảng <code>{selectedTable}</code>.
          </span>
          {selectedLevelOrdinal !== null && (
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Tầng: <strong>{selectedLevelOrdinal}</strong>
            </span>
          )}
        </label>
        <p className="text-sm text-slate-600">
          File: <strong>{importFileName}</strong>
        </p>
        <div className="flex items-center gap-2">
          <Tag color="blue">{importFeatures.length} geometry mới</Tag>
          <Tag color={duplicateCount ? 'warning' : 'success'}>
            {duplicateCount} geometry trùng đã bỏ qua
          </Tag>
        </div>
        {isImporting && (
          <div>
            <p className="mb-1 text-sm text-slate-600">Đang lưu dữ liệu vào cơ sở dữ liệu...</p>
            <Progress percent={importProgress} status="active" />
          </div>
        )}
      </div>
    </Modal>
  )
}
