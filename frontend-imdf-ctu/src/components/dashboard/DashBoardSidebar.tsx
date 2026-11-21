import { NavLink, useNavigate } from 'react-router'

export default function DashboardSidebar() {
  const DASHBOARD_SIDEBAR_NAV = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      children: [
        {
          label: 'Tổng quan',
          to: '/dashboard/overview',
        },
      ],
    },
    {
      label: 'Không gian và công trình',
      to: '/dashboard/space',
      children: [
        {
          label: 'Venue - Địa điểm',
          to: '/dashboard/space/venue',
        },
        {
          label: 'Building - Tòa nhà',
          to: '/dashboard/space/building',
        },
        {
          label: 'Address - Địa chỉ',
          to: '/dashboard/space/address',
        },
      ],
    },
    {
      label: 'Định tuyến đường đi',
      to: '/dashboard/route',
      children: [
        {
          label: 'IndoorRoute - Đường đi trong nhà',
          to: '/dashboard/route/indoor',
        },
      ],
    },
    {
      label: 'Danh mục chuẩn hóa',
      to: '/dashboard/category',
      children: [
        {
          label: 'Quản lý danh mục',
          to: '/dashboard/category',
        },
      ],
    },
  ]

  const activeNav = DASHBOARD_SIDEBAR_NAV.find((nav) => nav.to === window.location.pathname)

  const navigate = useNavigate()

  return (
    <div className="p-2 rounded-xl border border-slate-200 bg-white shadow-sm">
      {DASHBOARD_SIDEBAR_NAV.map((dbNav, index) => {
        return (
          <div
            className="text-sm font-bold text-blue-700 px-1 border-b border-gray-200 py-2 mb-2 "
            key={index}
          >
            {dbNav.label}

            {dbNav.children?.length > 0 &&
              dbNav.children?.map((childNav, childIndex) => {
                return (
                  <NavLink
                    key={childIndex}
                    to={childNav.to}
                    className={({ isActive }) =>
                      `block text-sm py-1 pl-4 mb-2 rounded hover:bg-sky-50 hover:text-sky-700 ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 font-semibold'
                          : 'font-normal text-gray-500'
                      }`
                    }
                  >
                    {childNav.label}
                  </NavLink>
                )
              })}
          </div>
        )
      })}
    </div>
  )
}
