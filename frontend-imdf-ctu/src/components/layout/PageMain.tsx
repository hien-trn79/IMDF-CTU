import PageHeader from './PageHeader'
import type { ReactNode } from 'react'

export default function PageMain({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <PageHeader />
      <main className="page-main w-full">{children}</main>
    </div>
  )
}
