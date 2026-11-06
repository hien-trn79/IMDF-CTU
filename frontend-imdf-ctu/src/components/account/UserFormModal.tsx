import { useEffect, useState } from 'react'
import { Button, Form, Input, Modal, Select, Switch } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import type { AccountUser, ModalMode, Notify, UserPayload } from '../../model/User.model'
import { adminApi } from './api'

interface Props {
  open: boolean
  mode: ModalMode
  user: AccountUser | null
  token: string | null
  notify: Notify
  onClose: () => void
  onSuccess: () => void
  onSwitchToEdit: () => void
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'USER', label: 'Người dùng' },
]

const TITLES: Record<ModalMode, string> = {
  create: 'Thêm tài khoản',
  view: 'Chi tiết tài khoản',
  edit: 'Chỉnh sửa tài khoản',
}

export default function UserFormModal({
  open,
  mode,
  user,
  token,
  notify,
  onClose,
  onSuccess,
  onSwitchToEdit,
}: Props) {
  const [form] = Form.useForm<UserPayload>()
  const [submitting, setSubmitting] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const readOnly = mode === 'view'

  // Nạp dữ liệu mỗi lần mở modal
  useEffect(() => {
    if (!open) return
    form.resetFields()

    if (mode === 'create') {
      form.setFieldsValue({ role: 'ADMIN', isActive: true })
      return
    }
    if (!user) return

    form.setFieldsValue(user) // hiện ngay dữ liệu có sẵn từ bảng
    // rồi đồng bộ lại bản mới nhất từ GET /users/{id}
    setLoadingDetail(true)
    adminApi
      .getUser(token, user.id)
      .then((detail) => form.setFieldsValue(detail))
      .catch((e: Error) => notify('error', 'Không tải được chi tiết', e.message))
      .finally(() => setLoadingDetail(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, user?.id])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      if (mode === 'create') {
        await adminApi.create(token, values)
        notify('success', 'Đã thêm tài khoản', `Tài khoản "${values.username}" đã được tạo.`)
      } else if (user) {
        const payload = { ...values }
        if (!payload.password) delete payload.password // không đổi mật khẩu nếu để trống
        await adminApi.update(token, user.id, payload)
        notify('success', 'Đã lưu thay đổi', `Tài khoản "${user.username}" đã được cập nhật.`)
      }
      onSuccess()
      onClose()
    } catch (e) {
      // lỗi validate của form thì antd tự hiện, chỉ báo lỗi từ API
      if (e instanceof Error) notify('error', 'Thao tác thất bại', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={<span className="text-lg font-semibold text-blue-700">{TITLES[mode]}</span>}
      onCancel={onClose}
      destroyOnHidden
      width={560}
      mask={{ closable: !submitting }}
      footer={
        readOnly ? (
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Đóng</Button>
            <Button type="primary" icon={<EditOutlined />} onClick={onSwitchToEdit}>
              Chỉnh sửa
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {mode === 'create' ? 'Thêm tài khoản' : 'Lưu thay đổi'}
            </Button>
          </div>
        )
      }
    >
      <Form
        form={form}
        layout="vertical"
        disabled={readOnly || loadingDetail}
        requiredMark={!readOnly}
        className="mt-4"
      >
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}
          >
            <Input placeholder="vd: admin01" disabled={mode === 'edit' || readOnly} />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Nhập họ và tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input placeholder="email@ctu.edu.vn" />
          </Form.Item>

          <Form.Item
            name="numberPhone"
            label="Số điện thoại"
            rules={[{ pattern: /^(0|\+84)\d{9,10}$/, message: 'Số điện thoại không hợp lệ' }]}
          >
            <Input placeholder="0901234567" />
          </Form.Item>

          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select
              options={ROLE_OPTIONS}
              getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </div>

        {!readOnly && (
          <Form.Item
            name="password"
            label={mode === 'create' ? 'Mật khẩu' : 'Mật khẩu mới'}
            extra={mode === 'edit' ? 'Để trống nếu không muốn đổi mật khẩu.' : undefined}
            rules={[
              { required: mode === 'create', message: 'Nhập mật khẩu' },
              { min: 6, message: 'Tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
