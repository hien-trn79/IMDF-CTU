import { Building2, Map, Route, Search } from 'lucide-react'
import React, { useEffect } from 'react'
import { useNavigation, type ActiveView } from '../../context/NavigationContext'

export default function PageHeader() {
  const { activeView, setActiveView } = useNavigation() // Replace with your logic to determine the active link

  const NAV_LINKS = [
    {
      label: 'Outdoors',
      to: 'Outdoors',
      icon: (<Building2 className="w-4 h-4" />) as React.ReactNode,
    },
    {
      label: 'Indoors',
      to: 'Indoors',
      icon: (<Route className="w-4 h-4" />) as React.ReactNode,
    },
    {
      label: 'Map',
      to: 'Map',
      icon: (<Map className="w-4 h-4" />) as React.ReactNode,
    },
  ]

  // Lay active view set mac dinh tu context NavigationContext khi component PageHeader duoc render lan dau tien
  useEffect(() => {
    if (!activeView) {
      setActiveView('Outdoors') // Set default active view to 'outdoors'
    }
  }, [activeView, setActiveView])
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
      <nav>
        <div className="ml-auto flex gap-1.5 shrink-0 rounded-xl border border-blue-100 bg-blue-50/70 px-2 shadow-sm sm:px-3 sm:py-1">
          {NAV_LINKS.map((link: { label: string; to: string; icon: any }) => (
            <div
              key={link.to}
              className={`flex cursor-pointer min-w-30 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-lg font-semibold transition-all sm:gap-2 sm:px-3 sm:py-2 sm:text-md lg:px-3.5
                ${
                  link.to === activeView
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }
              `}
              onClick={() => {
                setActiveView(link.to as ActiveView)
              }}
            >
              {link.icon}
              {link.label}
            </div>
          ))}
        </div>
      </nav>
    </header>
  )
}
