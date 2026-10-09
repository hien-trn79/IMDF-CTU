import PageHeader from './PageHeader'
import { Outlet } from 'react-router'

export default function Page() {
  return (
    <div className="page">
      <PageHeader />
      <main className="page-main w-full min-h-0">
        <Outlet />
      </main>
    </div>
  )
}
