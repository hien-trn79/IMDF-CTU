import {
  Building2,
  CircleUser,
  GraduationCap,
  Map,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
  X,
  LogOut,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useUser } from '../../context/UserContext'
import { useMapNavigation } from '../../context/MapNavigationContext'
import type { DestinationItem } from '../../model/Navigation.model'

export default function PageHeader() {
  const NAV_LINKS = [
    {
      label: 'Route',
      to: '/route',
      icon: (<Route className="w-4 h-4" />) as ReactNode,
      role: ['ADMIN'],
    },
    {
      label: 'Outdoor',
      to: '/outdoor',
      icon: (<MapPin className="w-4 h-4" />) as ReactNode,
      role: ['ADMIN'],
    },
    {
      label: 'Account',
      to: '/account',
      icon: (<CircleUser className="w-4 h-4" />) as ReactNode,
      role: ['USER', 'ADMIN'],
    },
    {
      label: 'Map',
      to: '/map',
      icon: (<Map className="w-4 h-4" />) as ReactNode,
      role: ['USER', 'ADMIN', ''],
    },
  ]

  const { authData, logout } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearchingLocations,
    allLocations,
    selectDestinationAndRoute,
  } = useMapNavigation()

  const [isOpenDropdown, setIsOpenDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const visibleLinks = NAV_LINKS.filter((link) => {
    return !link.role || link.role.includes(authData?.role ?? '')
  })

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Khi chọn 1 địa điểm từ thanh tìm kiếm
  const handleSelectDestination = (dest: DestinationItem) => {
    setIsOpenDropdown(false)
    setSearchQuery(dest.title)
    if (location.pathname !== '/map') {
      navigate('/map')
    }
    selectDestinationAndRoute(dest)
  }

  // Xử lý khi nhấn Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        handleSelectDestination(searchResults[0])
      } else if (searchQuery.trim().length > 0) {
        // Nếu gõ mã phòng mà chưa khớp, tìm thử mục đầu tiên khớp chuỗi con
        const fallback = allLocations.find(
          (loc) =>
            loc.roomCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        if (fallback) {
          handleSelectDestination(fallback)
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpenDropdown(false)
    }
  }

  // Danh sách gợi ý phổ biến khi chưa gõ từ khóa
  const popularSuggestions = allLocations
    .filter((loc) => loc.roomCode || loc.category === 'building')
    .slice(0, 6)

  return (
    <header className="page-header py-2.5 px-4 bg-white shadow-md flex justify-between items-center z-[3000] relative">
      {/* LOGO */}
      <div
        className="flex items-center gap-3 cursor-pointer shrink-0"
        onClick={() => navigate('/map')}
        title="Trang chủ bản đồ CTU"
      >
        <div className="logo-ctu">
          <img
            src="/ctu-logo.png"
            alt="CTU Logo"
            className="w-9 h-9 object-contain drop-shadow-sm transition-transform hover:scale-105"
          />
        </div>
        <div className="web-name">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-sky-700 to-indigo-600 tracking-tight">
            CTUMapping
          </h1>
        </div>
      </div>

      {/* INPUT SEARCH & AUTOCOMPLETE DROPDOWN */}
      <section ref={searchContainerRef} className="relative flex-1 max-w-xl mx-4 min-w-[280px]">
        <div className="relative w-full">
          <Search
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={18}
          />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpenDropdown(true)
            }}
            onFocus={() => setIsOpenDropdown(true)}
            onKeyDown={handleKeyDown}
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-10 font-k2d-regular text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
            placeholder="Tìm đường, mã phòng (VD: DI/101, 102), toà nhà..."
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setIsOpenDropdown(false)
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              title="Xoá tìm kiếm"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* DROPDOWN KẾT QUẢ TÌM KIẾM */}
        {isOpenDropdown && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-100 bg-white/95 p-2 shadow-2xl backdrop-blur-md z-[3100] animate-in fade-in-50 slide-in-from-top-2 duration-150">
            {searchQuery.trim() ? (
              isSearchingLocations && searchResults.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">Đang tìm địa điểm...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Kết quả tìm kiếm ({searchResults.length})</span>
                    <span className="text-[10px] lowercase text-sky-600 font-normal">
                      Nhấn Enter để chọn
                    </span>
                  </div>

                  {searchResults.map((dest) => {
                    const isRoom = dest.category === 'room'
                    return (
                      <div
                        key={dest.id}
                        onClick={() => handleSelectDestination(dest)}
                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2.5 transition-all hover:bg-sky-50 active:bg-sky-100"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                              isRoom
                                ? 'bg-emerald-500 text-white'
                                : dest.category === 'building'
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-amber-500 text-white'
                            }`}
                          >
                            {isRoom ? (
                              <GraduationCap size={18} />
                            ) : dest.category === 'building' ? (
                              <Building2 size={18} />
                            ) : (
                              <MapPin size={18} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-800 truncate group-hover:text-sky-700">
                                {dest.title}
                              </span>
                              {dest.roomCode && (
                                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800 shrink-0">
                                  {dest.roomCode}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {dest.subtitle || dest.address}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1 text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs font-semibold">Chỉ đường</span>
                          <Navigation size={13} className="fill-current" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-slate-500">
                  <p>Không tìm thấy địa điểm phù hợp với "{searchQuery}"</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Có thể tìm địa điểm ngoài CTU theo tên hoặc địa chỉ.
                  </p>
                </div>
              )
            ) : (
              // Gợi ý địa điểm phổ biến
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Địa điểm & Phòng học gợi ý</span>
                </div>
                {popularSuggestions.map((dest) => (
                  <div
                    key={dest.id}
                    onClick={() => handleSelectDestination(dest)}
                    className="flex cursor-pointer items-center justify-between rounded-xl p-2 transition hover:bg-slate-100/80"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        {dest.category === 'room' ? (
                          <GraduationCap size={15} />
                        ) : (
                          <Building2 size={15} />
                        )}
                      </div>
                      <div className="truncate text-sm font-medium text-slate-700">
                        {dest.title}
                      </div>
                    </div>
                    {dest.roomCode && (
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                        {dest.roomCode}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* NAVIGATION */}
      <nav className="flex items-center gap-3 justify-center shrink-0">
        <div className="ml-auto flex gap-1.5 shrink-0 rounded-xl border border-blue-100 bg-blue-50/70 px-2 shadow-sm sm:px-3 sm:py-1">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex cursor-pointer min-w-24 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-base font-semibold transition-all sm:gap-2 sm:px-3 sm:py-2 sm:text-sm lg:px-3.5 ${
                  isActive
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                } `
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="signInArea">
          <div className="flex items-center gap-1 rounded-2xl border border-blue-100 p-1.5 font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => navigate(authData ? '/account' : '/signin')}
              className="group flex cursor-pointer items-center gap-2 rounded-xl p-1.5 transition-all duration-300 ease-out hover:bg-blue-50"
            >
              <CircleUser className="h-5 w-5 text-primary transition-colors duration-500 group-hover:text-sky-700" />
              {authData ? (
                <span className="bg-linear-to-r from-primary to-sky-700 bg-clip-text text-transparent transition-all duration-500 text-sm">
                  {authData.email.split('@')[0]}
                </span>
              ) : (
                <span className="bg-linear-to-r from-primary to-sky-700 bg-clip-text text-transparent transition-all duration-500 text-sm">
                  Sign In
                </span>
              )}
            </button>
            {authData && (
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/map', { replace: true })
                }}
                className="rounded-xl p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
