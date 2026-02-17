import { Outlet } from 'react-router-dom'
import Sidebar from '../components/ui/Sidebar'

const DashboardLayout = () => (
  <div className="app-shell">
    <Sidebar />
    <main className="app-content">
      <Outlet />
    </main>
  </div>
)

export default DashboardLayout

