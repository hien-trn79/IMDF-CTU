import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Avatar,
  Button,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  notification,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useUser } from '../../context/UserContext'
import type { AccountUser, ModalMode, Notify } from '../../model/User.model'
import { adminApi } from './api'
import AdminProfileCard from './AdminProfileCard'
import UserFormModal from './UserFormModal'

export default function PageAccount() {
  // `logout` giả định có trong UserContext — đổi tên nếu context của bạn khác
  const { token, logout } = useUser() as { token: string | null; logout?: () => void }
  const [api, contextHolder] = notification.useNotification({ maxCount: 3 })
  const apiRef = useRef(api)
  apiRef.current = api

  const [me, setMe] = useState<AccountUser | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [users, setUsers] = useState<AccountUser[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingIds, setTogglingIds] = useState<number[]>([])

  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const [modal, setModal] = useState<{ open: boolean; mode: ModalMode; user: AccountUser | null }>({
    open: false,
    mode: 'create',
    user: null,
  })

  const getDisplayName = (u: AccountUser) => u.fullName || u.username || u.email || 'Không tên'
  const getInitial = (u: AccountUser) => getDisplayName(u).charAt(0).toUpperCase()

  const notify: Notify = useCallback(
    (type, message, description) =>
      apiRef.current[type]({
        message,
        description,
        placement: 'topRight',
        duration: 3,
        showProgress: true,
      }),
    []
  )

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await adminApi.getUsers(token))
    } catch (e) {
      notify('error', 'Không tải được danh sách', (e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [token, notify])

  useEffect(() => {
    if (!token) return
    setMeLoading(true)
    adminApi
      .getMe(token)
      .then(setMe)
      .catch((e: Error) => notify('error', 'Không tải được thông tin tài khoản', e.message))
      .finally(() => setMeLoading(false))
    fetchUsers()
  }, [token, fetchUsers, notify])

  // Lọc phía client
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    return users.filter((u) => {
      const matchKey =
        !k ||
        [u.username, u.fullName, u.email, u.numberPhone].some((v) => v?.toLowerCase().includes(k))
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter
      const matchStatus =
        statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive)
      return matchKey && matchRole && matchStatus
    })
  }, [users, keyword, roleFilter, statusFilter])

  const openModal = (mode: ModalMode, user: AccountUser | null = null) =>
    setModal({ open: true, mode, user })
  const closeModal = () => setModal((m) => ({ ...m, open: false }))

  // Bật/tắt isActive trực tiếp trên bảng (optimistic update)
  const toggleActive = async (user: AccountUser, checked: boolean) => {
    setTogglingIds((ids) => [...ids, user.id])
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, isActive: checked } : u)))
    try {
      await adminApi.update(token, user.id, {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        numberPhone: user.numberPhone,
        role: user.role,
        isActive: checked,
      })
      notify('success', checked ? 'Đã kích hoạt' : 'Đã vô hiệu hóa', `Tài khoản "${user.username}"`)
    } catch (e) {
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, isActive: !checked } : u)))
      notify('error', 'Không đổi được trạng thái', (e as Error).message)
    } finally {
      setTogglingIds((ids) => ids.filter((id) => id !== user.id))
    }
  }

  const deleteUser = (user: AccountUser) => {
    if (user.id === me?.id) {
      notify('error', 'Không thể xóa tài khoản đang đăng nhập')
      return
    }

    Modal.confirm({
      title: 'Xóa tài khoản này?',
      content: `Tài khoản "${user.username}" sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.`,
      okText: 'Xóa tài khoản',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await adminApi.delete(token, user.id)
          setUsers((list) => list.filter((item) => item.id !== user.id))
          notify('success', 'Đã xóa tài khoản', `Tài khoản "${user.username}" đã được xóa.`)
        } catch (e) {
          notify('error', 'Xóa tài khoản thất bại', (e as Error).message)
        }
      },
    })
  }

  const columns: ColumnsType<AccountUser> = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <Avatar className="!bg-gradient-to-br !from-blue-600 !to-violet-500 !font-semibold">
            {getInitial(u)}
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-800">{getDisplayName(u)}</div>
            <div className="truncate text-xs text-slate-400">
              {u.username ? `@${u.username}` : '—'}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => getDisplayName(a).localeCompare(getDisplayName(b)),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      ellipsis: true,
      responsive: ['md'],
      render: (v) => v || '—',
    },
    { title: 'Điện thoại', dataIndex: 'numberPhone', responsive: ['lg'], render: (v) => v || '—' },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 120,
      render: (r: string) => (
        <Tag
          bordered={false}
          color={r === 'ADMIN' ? 'purple' : 'blue'}
          className="!rounded-full !px-3"
        >
          {r}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      width: 130,
      render: (a: boolean) => (
        <Tag bordered={false} color={a ? 'success' : 'default'} className="!rounded-full !px-3">
          {a ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 190,
      align: 'center',
      fixed: 'right',
      render: (_, u) => (
        <div className="flex items-center justify-center gap-1">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => openModal('view', u)}
            />
          </Tooltip>
          <Tooltip title="Xóa tài khoản">
            <Button
              type="text"
              shape="circle"
              danger
              icon={<DeleteOutlined />}
              disabled={u.id === me?.id}
              onClick={() => deleteUser(u)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              shape="circle"
              className="!text-blue-600"
              icon={<EditOutlined />}
              onClick={() => openModal('edit', u)}
            />
          </Tooltip>
          <Tooltip title={u.isActive ? 'Tắt tài khoản' : 'Bật tài khoản'}>
            <Switch
              size="small"
              checked={u.isActive}
              loading={togglingIds.includes(u.id)}
              disabled={u.id === me?.id} // không cho admin tự khóa mình
              onChange={(c) => toggleActive(u, c)}
            />
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4 px-4">
      {contextHolder}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-blue-700">Quản lý tài khoản người dùng</h1>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          className="bg-blue-700 font-semibold border-0! shadow-md"
          onClick={() => openModal('create')}
        >
          Thêm tài khoản
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* SIDEBAR ADMIN ACCOUNT */}
        <AdminProfileCard me={me} loading={meLoading} onLogout={() => logout?.()} />

        {/* MAIN: USER LIST */}
        <section className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm theo tên, tài khoản, email, SĐT..."
              className="!w-full sm:!w-72"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              className="w-40"
              options={[
                { value: 'ALL', label: 'Tất cả vai trò' },
                { value: 'ADMIN', label: 'Quản trị viên' },
                { value: 'USER', label: 'Người dùng' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-40"
              options={[
                { value: 'ALL', label: 'Mọi trạng thái' },
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'INACTIVE', label: 'Đã khóa' },
              ]}
            />
            <Tooltip title="Tải lại">
              <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading} />
            </Tooltip>
            <span className="ml-auto text-sm text-slate-400">
              {filtered.length}/{users.length} tài khoản
            </span>
          </div>

          <Table<AccountUser>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            scroll={{ x: 760 }}
            locale={{ emptyText: 'Không có tài khoản phù hợp' }}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
              showTotal: (total, [from, to]) => `${from}–${to} / ${total}`,
            }}
          />
        </section>
      </div>

      <UserFormModal
        open={modal.open}
        mode={modal.mode}
        user={modal.user}
        token={token}
        notify={notify}
        onClose={closeModal}
        onSuccess={fetchUsers}
        onSwitchToEdit={() => setModal((m) => ({ ...m, mode: 'edit' }))}
      />
    </div>
  )
}
