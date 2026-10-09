import { Building2, CircleUser, Map, Route, Search } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router'
import { useState, type ReactNode } from 'react'
import { useUser } from '../../context/UserContext'

export default function PageHeader() {
  const NAV_LINKS = [
    {
      label: 'Outdoors',
      to: '/outdoors',
      icon: (<Building2 className="w-4 h-4" />) as ReactNode,
      role: ['ADMIN'], // Chỉ hiển thị link này nếu ROLE là ADMIN
    },
    {
      label: 'Indoors',
      to: '/indoors',
      icon: (<Route className="w-4 h-4" />) as ReactNode,
      role: ['ADMIN'], // Chỉ hiển thị link này nếu ROLE là ADMIN
    },
    {
      label: 'Map',
      to: '/map',
      icon: (<Map className="w-4 h-4" />) as ReactNode,
      role: ['USER', 'ADMIN', ''], // Chỉ hiển thị link này nếu ROLE là USER
    },
  ]

  const { authData } = useUser()
  const navigate = useNavigate()

  const visibleLinks = NAV_LINKS.filter((link) => {
    return !link.role || link.role.includes(authData?.role ?? '')
  })

  return (
    <header className="page-header py-3 px-2 bg-white shadow-md flex justify-between items-center">
      {/* LOGO */}
      <div className="flex items-center gap-3">
        <div className="logo-ctu">
          <img
            src="/ctu-logo.png"
            alt="CTU Logo"
            className="w-9 h-9 object-contain drop-shadow-sm"
          />
        </div>
        <div className="web-name">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-sky-700 to-indigo-600 tracking-tight">
            CTUMapping
          </h1>
        </div>
      </div>

      {/* INPUT SEARCH */}
      <section className="min-w-[50%]">
        <label className="relative mx-auto hidden w-full max-w-xl md:block">
          <Search
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            name="search"
            size={16}
          />
          <input
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 font-k2d-regular text-md text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Search location, room, layer..."
          />
        </label>
      </section>

      {/* NAVIGATION */}
      <nav className="flex items-center gap-3 justify-center">
        <div className="ml-auto flex gap-1.5 shrink-0 rounded-xl border border-blue-100 bg-blue-50/70 px-2 shadow-sm sm:px-3 sm:py-1">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex cursor-pointer min-w-30 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-lg font-semibold transition-all sm:gap-2 sm:px-3 sm:py-2 sm:text-md lg:px-3.5 ${
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
          <div
            onClick={() => {
              navigate(authData ? '/me' : '/signin')
            }}
            className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-blue-100 p-3 font-semibold shadow-sm transition-all duration-300 ease-out hover:border-sky-300 hover:shadow-md"
          >
            <CircleUser className="mr-1 h-5 w-5 text-primary transition-colors duration-500 group-hover:text-sky-700" />

            {/* Nửa trái của gradient là màu primary, nửa phải là sky-700 → indigo-600.
            Hover chỉ trượt background-position nên chuyển màu rất mượt. */}
            {authData ? (
              <span className="bg-linear-to-r from-primary to-sky-700 bg-200% bg-bottom-left bg-clip-text text-transparent transition-all duration-500 group-hover:bg-right-bottom">
                {authData.email.split('@')[0]}
              </span>
            ) : (
              <span className="bg-linear-to-r from-primary to-sky-700 bg-200% bg-bottom-left bg-clip-text text-transparent transition-all duration-500 group-hover:bg-right-bottom">
                Sign In
              </span>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
