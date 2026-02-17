import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RequireAuth from '../auth/RequireAuth'
import RequireRole from '../auth/RequireRole'
import { AuthProvider } from '../auth/AuthContext'
import DashboardLayout from './DashboardLayout'
import HomePage from '../features/home/HomePage'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import CoursesPage from '../features/courses/CoursesPage'
import FeedPage from '../features/feed/FeedPage'
import ForumPage from '../features/forum/ForumPage'
import { routes } from '../routes/paths'
import type { UserRole } from '../types/User'

const memberRoles: UserRole[] = ['Initium', 'Ascensio', 'Dominus', 'Admin', 'Official', 'Curated']

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allowedRoles={memberRoles} />}>
            <Route element={<DashboardLayout />}>
              <Route path={routes.dashboard} element={<DashboardPage />} />
              <Route path={routes.courses} element={<CoursesPage />} />
              <Route path={routes.feed} element={<FeedPage />} />
              <Route path={routes.forum} element={<ForumPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
