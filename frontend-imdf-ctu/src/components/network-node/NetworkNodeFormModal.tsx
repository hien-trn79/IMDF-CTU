import { useEffect, useState } from 'react'
import { Modal, Form, Switch, Select, InputNumber, Alert, Divider } from 'antd'
import { AimOutlined } from '@ant-design/icons'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'
import { wkbHexToPoint } from '../../utils/wkbParser'
import { pointToWkbHex } from '../../utils/wkbEncoder'

interface FormValues {
  isConnector: boolean
  lat: number
  lng: number
  indoorRouteId: number
}

interface NetworkNodeFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: { isConnector: boolean; geom: string; indoorRouteId: number }) => Promise<void>
  initialData: NetworkNodeResponse | null
  submitting: boolean
  error?: string | null
  indoorRoutes: IndoorRouteResponse[]
}

export default function NetworkNodeFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  submitting,
  error,
  indoorRoutes,
}: NetworkNodeFormModalProps) {
  const [form] = Form.useForm<FormValues>()
  const isEdit = !!initialData
  const [previewWkb, setPreviewWkb] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const coords = wkbHexToPoint(initialData.geom)
        form.setFieldsValue({
          isConnector: initialData.isConnector ?? false,
          lat: coords ? coords[1] : undefined,
          lng: coords ? coords[0] : undefined,
          indoorRouteId: initialData.indoorRouteId,
        })
        if (coords) setPreviewWkb(pointToWkbHex(coords[0], coords[1]))
      } else {
        form.resetFields()
        setPreviewWkb('')
      }
    }
  }, [isOpen, initialData, form])

  const handleValuesChange = (_: any, all: FormValues) => {
    if (all.lat && all.lng) {
      setPreviewWkb(pointToWkbHex(all.lng, all.lat))
    }
  }

  const handleFinish = async (values: FormValues) => {
    const geom = pointToWkbHex(values.lng, values.lat)
    await onSubmit({
      isConnector: values.isConnector ?? false,
      geom,
      indoorRouteId: values.indoorRouteId,
    })
  }

  return (
    <Modal
      title={
        <span className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <AimOutlined className="text-emerald-600" />
          {isEdit ? 'Chỉnh sửa Network Node' : 'Thêm Network Node mới'}
        </span>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText={isEdit ? 'Lưu thay đổi' : 'Tạo Node'}
      cancelText="Hủy bỏ"
      destroyOnClose
      maskClosable={!submitting}
      width={520}
    >
      <div className="pt-3">
        {error && (
          <Alert
            message="Lỗi lưu dữ liệu"
            description={error}
            type="error"
            showIcon
            closable
            className="mb-4"
          />
        )}

        {isEdit && initialData && (
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 mb-4 text-sm text-gray-600">
            <span className="text-gray-500 mr-2">ID Node:</span>
            <span className="font-bold text-emerald-800">#{initialData.id}</span>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={handleValuesChange}
          requiredMark="optional"
          disabled={submitting}
        >
          <Form.Item
            name="indoorRouteId"
            label={<span className="font-medium text-gray-700">Tuyến đường (Indoor Route)</span>}
            rules={[{ required: true, message: 'Vui lòng chọn tuyến đường' }]}
          >
            <Select
              placeholder="Chọn tuyến đường..."
              showSearch
              optionFilterProp="label"
              size="large"
              options={indoorRoutes.map((r) => ({
                value: r.id,
                label: `#${r.id} — ${r.indoorRouteName}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="isConnector"
            label={<span className="font-medium text-gray-700">Là Connector (nối tầng)</span>}
            valuePropName="checked"
          >
            <Switch checkedChildren="Connector" unCheckedChildren="Thường" />
          </Form.Item>

          <Divider titlePlacement="start" plain className="!text-xs !text-gray-500">
            Tọa độ điểm (WGS84 — EPSG:4326)
          </Divider>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="lat"
              label={<span className="font-medium text-gray-700">Vĩ độ (Latitude)</span>}
              rules={[
                { required: true, message: 'Nhập vĩ độ' },
                { type: 'number', min: -90, max: 90, message: 'Vĩ độ: -90 đến 90' },
              ]}
            >
              <InputNumber
                placeholder="10.030..."
                className="w-full"
                size="large"
                step={0.000001}
                precision={8}
              />
            </Form.Item>

            <Form.Item
              name="lng"
              label={<span className="font-medium text-gray-700">Kinh độ (Longitude)</span>}
              rules={[
                { required: true, message: 'Nhập kinh độ' },
                { type: 'number', min: -180, max: 180, message: 'Kinh độ: -180 đến 180' },
              ]}
            >
              <InputNumber
                placeholder="105.768..."
                className="w-full"
                size="large"
                step={0.000001}
                precision={8}
              />
            </Form.Item>
          </div>

          {previewWkb && (
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 mt-1">
              <p className="text-[10px] text-gray-500 mb-1 font-medium">
                WKB Hex preview (gửi lên backend):
              </p>
              <code className="text-[10px] font-mono text-gray-600 break-all">{previewWkb}</code>
            </div>
          )}
        </Form>
      </div>
    </Modal>
  )
}
