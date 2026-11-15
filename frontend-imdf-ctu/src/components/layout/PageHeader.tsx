import {
  CircleUser,
  Clock,
  GraduationCap,
  Landmark,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
  Store,
  X,
  LogOut,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useUser } from '../../context/UserContext'
import { useNavigateContext } from '../../context/NavigateContext'
import { normalizeText, type SearchResultItem } from '../../utils/searchUtils'
import { searchExternalPlaces } from '../map/Placesearchservice'

const RECENT_KEY = 'ctumap:recent-searches'
const MAX_RECENT = 5

const loadRecent = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT)
      : []
  } catch {
    return []
  }
}

const saveRecent = (list: string[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    // localStorage bị chặn (chế độ riêng tư...): bỏ qua
  }
}

// Style icon theo loại kết quả
const CATEGORY_STYLE: Record<SearchResultItem['category'], { box: string; icon: ReactNode }> = {
  unit: { box: 'bg-emerald-500 text-white', icon: <GraduationCap size={18} /> },
  anchor: { box: 'bg-indigo-500 text-white', icon: <MapPin size={18} /> },
  amenity: { box: 'bg-amber-500 text-white', icon: <Store size={18} /> },
  place: { box: 'bg-sky-600 text-white', icon: <Landmark size={18} /> },
}

// In đậm phần chữ trùng với từ khoá (so khớp không phân biệt hoa thường và dấu)
function Highlight({ text, query }: { text: string; query: string }) {
  const q = normalizeText(query.trim())
  const idx = q ? normalizeText(text).indexOf(q) : -1
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-extrabold text-sky-700">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}

// Tìm địa điểm bên ngoài (Bến Ninh Kiều, quán cà phê...) khi người dùng gõ.
// Debounce 400ms và huỷ request cũ để không vượt giới hạn của API miễn phí.
function useExternalPlaces(query: string, enabled: boolean) {
  const [places, setPlaces] = useState<SearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const q = query.trim()
    // Cần >= 3 ký tự và có ít nhất 1 chữ cái (bỏ qua chuỗi chỉ gồm số/ký hiệu)
    if (!enabled || q.length < 3 || !/\p{L}/u.test(q)) {
      setPlaces([])
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    setIsSearching(true)

    const timer = setTimeout(async () => {
      try {
        const result = await searchExternalPlaces(q, controller.signal)
        if (!controller.signal.aborted) setPlaces(result)
      } catch {
        if (!controller.signal.aborted) setPlaces([]) // lỗi mạng / bị giới hạn: chỉ hiện kết quả trong nhà
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, enabled])

  return { places, isSearching }
}

export default function PageHeader() {
  const NAV_LINKS = [
    {
      label: 'Route',
      to: '/route',
      icon: (<Route className="w-4 h-4" />) as ReactNode,
      role: ['ADMIN'],
    },
    {
      label: 'Indoor',
      to: '/indoor',
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

  const { searchItems, suggestions, isSearchReady, prepareSearch, selectDestination } =
    useNavigateContext()

  const [searchQuery, setSearchQuery] = useState('')
  const [isOpenDropdown, setIsOpenDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const hasQuery = searchQuery.trim().length > 0

  // Tìm trên mọi tầng đã nạp; khi chưa gõ gì thì hiển thị gợi ý
  const searchResults = useMemo(() => searchItems(searchQuery), [searchItems, searchQuery])
  // Địa điểm bên ngoài (chỉ gọi khi dropdown đang mở)
  const { places: externalPlaces, isSearching: isSearchingExternal } = useExternalPlaces(
    searchQuery,
    isOpenDropdown
  )
  // Danh sách dùng cho phím mũi tên: kết quả trong nhà rồi tới địa điểm bên ngoài
  const listItems = hasQuery ? [...searchResults, ...externalPlaces] : suggestions
  const safeIndex = Math.min(activeIndex, listItems.length - 1)

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

  // Cuộn mục đang chọn (bằng phím mũi tên) vào vùng nhìn thấy
  useEffect(() => {
    if (!isOpenDropdown || safeIndex < 0) return
    document.getElementById(`search-option-${safeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [safeIndex, isOpenDropdown])

  const changeQuery = (value: string) => {
    setSearchQuery(value)
    setActiveIndex(value.trim() ? 0 : -1)
  }

  const pushRecent = (title: string) => {
    const next = [title, ...recent.filter((t) => t !== title)].slice(0, MAX_RECENT)
    setRecent(next)
    saveRecent(next)
  }

  const clearRecent = () => {
    setRecent([])
    saveRecent([])
  }

  // Khi chọn 1 địa điểm từ thanh tìm kiếm
  const handleSelectDestination = (dest: SearchResultItem) => {
    setIsOpenDropdown(false)
    setSearchQuery(dest.title)
    pushRecent(dest.title)
    if (location.pathname !== '/map') {
      navigate('/map')
    }
    selectDestination(dest)
  }

  // Phím tắt: mũi tên chọn gợi ý, Enter xác nhận, Escape đóng
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpenDropdown(true)
      setActiveIndex((i) => Math.min(i + 1, listItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const target = listItems[safeIndex]
      if (target) handleSelectDestination(target)
    } else if (e.key === 'Escape') {
      setIsOpenDropdown(false)
    }
  }

  // Dòng 1 kết quả / gợi ý
  const renderItem = (dest: SearchResultItem, index: number, showHighlight: boolean) => {
    const style = CATEGORY_STYLE[dest.category]
    const isActive = index === safeIndex

    return (
      <div
        key={dest.id}
        id={`search-option-${index}`}
        role="option"
        aria-selected={isActive}
        onClick={() => handleSelectDestination(dest)}
        onMouseEnter={() => setActiveIndex(index)}
        className={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2.5 transition-all ${
          isActive ? 'bg-sky-50' : 'hover:bg-sky-50'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${style.box}`}
          >
            {style.icon}
          </div>

          <div className="min-w-0">
            <span className="block font-bold text-sm text-slate-800 truncate group-hover:text-sky-700">
              {showHighlight ? <Highlight text={dest.title} query={searchQuery} /> : dest.title}
            </span>
            {dest.subtitle && <p className="text-xs text-slate-500 truncate">{dest.subtitle}</p>}
          </div>
        </div>

        <div
          className={`shrink-0 flex items-center gap-1 text-sky-600 transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <span className="text-xs font-semibold">Xem</span>
          <Navigation size={13} className="fill-current" />
        </div>
      </div>
    )
  }

  return (
    <header className="page-header py-2.5 px-4 bg-white shadow-md flex justify-between items-center z-3000 relative">
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
              changeQuery(e.target.value)
              setIsOpenDropdown(true)
            }}
            onFocus={() => {
              setIsOpenDropdown(true)
              void prepareSearch() // thử nạp lại dữ liệu tìm kiếm nếu lần trước bị lỗi
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={isOpenDropdown}
            aria-controls="search-listbox"
            aria-autocomplete="list"
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-10 font-k2d-regular text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
            placeholder="Tìm phòng, tiện ích hoặc địa điểm (VD: DI/101, Bến Ninh Kiều)..."
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                changeQuery('')
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
          <div
            id="search-listbox"
            role="listbox"
            className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-100 bg-white/95 p-2 shadow-2xl backdrop-blur-md z-[3100] animate-in fade-in-50 slide-in-from-top-2 duration-150"
          >
            {hasQuery ? (
              <div className="space-y-2">
                {/* Kết quả trong khuôn viên (phòng, tiện ích) */}
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Trong khuôn viên ({searchResults.length})</span>
                      <span className="text-[10px] lowercase text-sky-600 font-normal">
                        ↑ ↓ để chọn · Enter để xem
                      </span>
                    </div>
                    {searchResults.map((dest, i) => renderItem(dest, i, true))}
                  </div>
                )}

                {/* Địa điểm khác trên bản đồ (OpenStreetMap / Photon) */}
                {(externalPlaces.length > 0 || isSearchingExternal) && (
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Landmark size={13} />
                      <span>Địa điểm khác trên bản đồ</span>
                      {isSearchingExternal && (
                        <Loader2 size={12} className="animate-spin text-sky-600" />
                      )}
                    </div>
                    {externalPlaces.map((dest, i) =>
                      renderItem(dest, searchResults.length + i, true)
                    )}
                    {isSearchingExternal && externalPlaces.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-400">Đang tìm địa điểm...</p>
                    )}
                    {externalPlaces.length > 0 && (
                      <p className="px-3 pt-1 text-[10px] text-slate-400">
                        Dữ liệu địa điểm: © OpenStreetMap contributors · Photon
                      </p>
                    )}
                  </div>
                )}

                {/* Không có kết quả nào */}
                {searchResults.length === 0 &&
                  externalPlaces.length === 0 &&
                  !isSearchingExternal && (
                    <div className="py-6 text-center text-sm text-slate-500">
                      {isSearchReady ? (
                        <>
                          <p>Không tìm thấy địa điểm phù hợp với "{searchQuery}"</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Thử gõ mã phòng (VD: DI/101), tên phòng, tiện ích hoặc tên địa điểm.
                          </p>
                        </>
                      ) : (
                        <p>Đang tải dữ liệu địa điểm...</p>
                      )}
                    </div>
                  )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Tìm kiếm gần đây */}
                {recent.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        Tìm gần đây
                      </span>
                      <button
                        type="button"
                        onClick={clearRecent}
                        className="text-[10px] font-semibold normal-case text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        Xoá
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                      {recent.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => changeQuery(term)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gợi ý địa điểm */}
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Gợi ý địa điểm</span>
                  </div>
                  {suggestions.length > 0 ? (
                    suggestions.map((dest, i) => renderItem(dest, i, false))
                  ) : (
                    <p className="px-3 py-3 text-center text-sm text-slate-500">
                      {isSearchReady
                        ? 'Nhập mã phòng hoặc tên tiện ích để tìm kiếm.'
                        : 'Đang tải dữ liệu địa điểm...'}
                    </p>
                  )}
                </div>
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
