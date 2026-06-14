import Sidebar from '@/components/layout/Sidebar'
import OfflineBanner from '@/components/layout/OfflineBanner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-bg min-h-screen flex flex-col">
      <OfflineBanner />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
