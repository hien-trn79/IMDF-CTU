import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Alert } from 'antd'
import type { IndoorRouteRequest, IndoorRouteResponse } from '../../model/IndoorRoute.model'

interface IndoorRouteFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: IndoorRouteRequest) => Promise<void>
  initialData: IndoorRouteResponse | null
  submitting: boolean
  error?: string | null
}

export default function IndoorRouteFormModal({
  isOpen, onClose, onSubmit, initialData, submitting, error
}: IndoorRouteFormModalProps) {
  const [form] = Form.useForm<IndoorRouteRequest>()
  const isEdit = !!initialData

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.setFieldsValue({
          indoorRouteName: initialData.indoorRouteName,
          description: initialData.description,
          startNodeId: initialData.startNodeId,
          endNodeId: initialData.endNodeId,
        })
      } else {
        form.resetFields()
      }
    }
  }, [isOpen, initialData, form])

  const handleFinish = async (values: IndoorRouteRequest) => {
    await onSubmit(values)
  }

  return (
    <Modal
      title={
        <span className="text-base font-semibold text-gray-800">
          {isEdit ? 'Chỉnh sửa Tuyến đường' : 'Thêm Tuyến đường mới'}
        </span>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText={isEdit ? 'Lưu thay đổi' : 'Tạo Tuyến đường'}
      cancelText="Hủy bỏ"
      destroyOnClose
      maskClosable={!submitting}
      width={500}
    >
      <div className="pt-4">
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
          <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 mb-5 text-sm text-gray-600 flex justify-between items-center">
            <div>
              <span className="text-gray-500 mr-2">ID:</span>
              <span className="font-bold text-sky-800">#{initialData.id}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-2">UUID:</span>
              <code className="font-mono text-xs bg-white px-2 py-1 rounded border border-gray-200">
                {initialData.indoorRouteId}
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
            name="indoorRouteName"
            label={<span className="font-medium text-gray-700">Tên Tuyến đường</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập tên tuyến đường' },
              { max: 255, message: 'Tên không được vượt quá 255 ký tự' }
            ]}
          >
            <Input placeholder="Ví dụ: Lối đi từ cổng chính đến sảnh G..." size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="font-medium text-gray-700">Mô tả</span>}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập thông tin chi tiết hoặc ghi chú về tuyến đường này..."
              className="resize-y"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="startNodeId"
              label={<span className="font-medium text-gray-700">ID Nút bắt đầu</span>}
            >
              <InputNumber placeholder="Ví dụ: 101" className="w-full" size="large" />
            </Form.Item>

            <Form.Item
              name="endNodeId"
              label={<span className="font-medium text-gray-700">ID Nút kết thúc</span>}
            >
              <InputNumber placeholder="Ví dụ: 205" className="w-full" size="large" />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  )
}
