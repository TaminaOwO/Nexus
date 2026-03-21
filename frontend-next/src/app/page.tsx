import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import InboxPanel from '@/components/InboxPanel'

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar departmentName="Dev" />
        <main className="flex-1 p-6">
          <InboxPanel />
        </main>
      </div>
    </div>
  )
}
