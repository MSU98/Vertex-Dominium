import { Outlet } from 'react-router-dom'
import PublicNavbar from '../components/ui/PublicNavbar'

const PublicLayout = () => (
  <>
    <PublicNavbar />
    <main className="public-content">
      <Outlet />
    </main>
  </>
)

export default PublicLayout
