import { Outlet } from 'react-router'
import DashboardSidebar from './DashBoardSidebar'
import type { RestrictionCategoryResponse } from '../../model/imdf models/Restriction.model'
import { useEffect, useState } from 'react'

export default function PageDashboard() {
  const [_restrictionCategories, setRestrictionCategories] = useState<RestrictionCategoryResponse[]>(
    []
  )

  useEffect(() => {
    const fetchRestrictionCategories = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/restriction-categories', {
          headers: {
            method: 'GET',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (!response.ok) throw new Error('Failed to fetch restriction categories')
        const data: RestrictionCategoryResponse[] = await response.json()
        setRestrictionCategories(data)
      } catch (error) {
        console.error('Error fetching restriction categories:', error)
      }
    }

    fetchRestrictionCategories()
  }, [])

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-5 items-start px-2">
      {/* Dashboard sidebar nav */}
      <aside className="min-w-0 overflow-y-auto lg:col-span-1 lg:max-h-[min(85vh,750px)] justify-items-center">
        <DashboardSidebar />
      </aside>
      <main className="min-w-0 lg:col-span-4 p-2 rounded-xl border border-slate-200 bg-white shadow-sm h-screen lg:max-h-[min(85vh,750px)] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
