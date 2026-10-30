import { Avatar, Button, Popconfirm, Skeleton, Tag } from 'antd'
import {
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { AccountUser } from '../../model/User.model'

interface Props {
  me: AccountUser | null
  loading: boolean
  onLogout: () => void
}

const Row = ({ icon, label, value }: { icon: ReactNode; label: string; value?: ReactNode }) => (
  <div className="flex items-start gap-3 py-2.5">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
      {icon}
    </span>
    <div className="min-w-0">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="truncate text-sm font-medium text-slate-700">{value || '—'}</div>
    </div>
  </div>
)

export default function AdminProfileCard({ me, loading, onLogout }: Props) {
  const initial = (me?.fullName || me?.username || '?').charAt(0).toUpperCase()

  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:sticky lg:top-4 lg:min-h-[calc(100vh-140px)]">
      {/* Banner */}
      <div className="h-24 bg-linear-to-r from-blue-600 via-blue-500 to-blue-400" />

      <div className="-mt-10 flex flex-col items-center px-5">
        {loading ? (
          <Skeleton.Avatar active size={80} />
        ) : (
          <Avatar
            size={80}
            className="border-4 border-white bg-linear-to-br! from-blue-400 to-blue-600 text-3xl font-semibold shadow"
          >
            {initial}
          </Avatar>
        )}
        {loading ? (
          <Skeleton active paragraph={{ rows: 1 }} title={false} className="mt-3 w-40" />
        ) : (
          <>
            <h2 className="mt-3 text-lg font-bold text-slate-800">
              {me?.fullName || me?.username}
            </h2>
            <Tag color="blue" bordered={false} className="!mt-1 !rounded-full !px-3">
              {me?.role}
            </Tag>
          </>
        )}
      </div>

      <div className="mt-3 flex-1 divide-y divide-slate-50 px-5">
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} title={false} />
        ) : (
          <>
            <Row icon={<UserOutlined />} label="Tên đăng nhập" value={me?.username} />
            <Row icon={<IdcardOutlined />} label="Họ và tên" value={me?.fullName} />
            <Row icon={<MailOutlined />} label="Email" value={me?.email} />
            <Row icon={<PhoneOutlined />} label="Số điện thoại" value={me?.numberPhone} />
            <Row
              icon={<CalendarOutlined />}
              label="Ngày tạo"
              value={me?.createdAt ? new Date(me.createdAt).toLocaleDateString('vi-VN') : undefined}
            />
          </>
        )}
      </div>

      {/* Đăng xuất: nằm dưới cùng */}
      <div className="border-t border-slate-100 p-5">
        <Popconfirm
          title="Đăng xuất khỏi hệ thống?"
          okText="Đăng xuất"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={onLogout}
        >
          <Button block danger icon={<LogoutOutlined />} size="large">
            Đăng xuất
          </Button>
        </Popconfirm>
      </div>
    </aside>
  )
}
