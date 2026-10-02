import { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, Switch, Alert } from 'antd'
import type { GridLineRequest, GridLineResponse } from '../../model/GridLine.model'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'
import { coordsToWKBHex, parseWKBHexToCoords } from '../../utils/wkbUtils'

interface GridLineFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: GridLineRequest) => Promise<void>
  initialData: GridLineResponse | null
  indoorRoutes: IndoorRouteResponse[]
  submitting: boolean
  error?: string | null
}

const CATEGORY_OPTIONS = [
  { label: 'Grid Line (grid_line)', value: 'grid_line' },
  { label: 'Hành lang (corridor)', value: 'corridor' },
  { label: 'Thang bộ (stairs)', value: 'stairs' },
  { label: 'Thang máy (elevator)', value: 'elevator' },
  { label: 'Thoát hiểm (emergency)', value: 'emergency' },
]

interface FormValues {
  category: string
  isOneWay: boolean
  indoorRouteId: number
  coordsText: string
}

function coordsToText(coords: [number, number][]): string {
  return coords.map(([lng, lat]) => `${lng},${lat}`).join('\n')
}

function textToCoords(text: string): [number, number][] | null {
  const lines = text.trim().split('\n').filter(Boolean)
  const pts: [number, number][] = []
  for (const line of lines) {
    const parts = line.trim().split(/[,\s]+/)
    if (parts.length < 2) return null
    const lng = parseFloat(parts[0])
    const lat = parseFloat(parts[1])
    if (isNaN(lng) || isNaN(lat)) return null
    pts.push([lng, lat])
  }
  return pts.length >= 2 ? pts : null
}

export default function GridLineFormModal({
  isOpen, onClose, onSubmit, initialData, indoorRoutes, submitting, error
}: GridLineFormModalProps) {
  const [form] = Form.useForm<FormValues>()
  const isEdit = !!initialData
  const [coordError, setCoordError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setCoordError(null)
    if (initialData) {
      const coords = parseWKBHexToCoords(initialData.geom)
      form.setFieldsValue({
        category: initialData.category,
        isOneWay: initialData.isOneWay,
        indoorRouteId: initialData.indoorRouteId,
        coordsText: coordsToText(coords),
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ isOneWay: false, category: 'grid_line' })
    }
  }, [isOpen, initialData, form])

  const handleFinish = async (values: FormValues) => {
    setCoordError(null)
    const coords = textToCoords(values.coordsText)
    if (!coords) {
      setCoordError('Tọa độ không hợp lệ. Mỗi dòng là: kinh_độ,vĩ_độ (VD: 105.769183,10.030818). Tối thiểu 2 điểm.')
      return
    }
    const geomHex = coordsToWKBHex(coords)
    await onSubmit({
      category: values.category,
      isOneWay: values.isOneWay,
      indoorRouteId: values.indoorRouteId,
      geom: geomHex,
    })
  }

  return (
    <Modal
      title={
        <span className="text-base font-semibold text-gray-800">
          {isEdit ? 'Chỉnh sửa GridLine' : 'Thêm GridLine mới'}
        </span>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText={isEdit ? 'Lưu thay đổi' : 'Tạo GridLine'}
      cancelText="Hủy bỏ"
      destroyOnClose
      maskClosable={!submitting}
      width={540}
    >
      <div className="pt-2">
        {(error || coordError) && (
          <Alert
            message={coordError ? 'Tọa độ không hợp lệ' : 'Lỗi lưu dữ liệu'}
            description={coordError || error}
            type="error"
            showIcon
            closable
            className="mb-4"
          />
        )}

        {isEdit && initialData && (
          <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 mb-4 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>ID:</span><span className="font-semibold text-sky-800">#{initialData.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>UUID:</span>
              <code className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200">
                {initialData.gridLineId}
              </code>
            </div>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark="optional"
          disabled={submitting}
        >
          <Form.Item
            name="indoorRouteId"
            label="Thuộc tuyến đường (Indoor Route)"
            rules={[{ required: true, message: 'Vui lòng chọn tuyến đường' }]}
          >
            <Select
              placeholder="Chọn tuyến đường..."
              options={indoorRoutes.map((r) => ({
                label: `#${r.id} – ${r.indoorRouteName}`,
                value: r.id,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="category"
              label="Phân loại (Category)"
              rules={[{ required: true, message: 'Chọn phân loại' }]}
            >
              <Select options={CATEGORY_OPTIONS} placeholder="Chọn phân loại..." />
            </Form.Item>

            <Form.Item name="isOneWay" label="Một chiều" valuePropName="checked">
              <Switch checkedChildren="Một chiều" unCheckedChildren="Hai chiều" />
            </Form.Item>
          </div>

          <Form.Item
            name="coordsText"
            label={
              <div>
                <span>Tọa độ điểm đường (Kinh độ, Vĩ độ)</span>
                <span className="ml-1 text-xs text-gray-400">— mỗi dòng 1 điểm, tối thiểu 2 điểm</span>
              </div>
            }
            rules={[{ required: true, message: 'Nhập ít nhất 2 điểm tọa độ' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder={`105.769183,10.030818\n105.769110,10.030893\n...`}
              className="font-mono text-xs"
            />
          </Form.Item>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            <strong>Định dạng tọa độ:</strong> Mỗi dòng là một điểm theo thứ tự <code>kinh_độ,vĩ_độ</code> (lng, lat).
            Ví dụ: <code>105.769183,10.030818</code>. Tối thiểu 2 điểm để tạo thành đường.
          </div>
        </Form>
      </div>
    </Modal>
  )
}
