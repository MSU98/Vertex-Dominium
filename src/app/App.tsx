import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RequireAuth from '../auth/RequireAuth'
import RequireRole from '../auth/RequireRole'
import { AuthProvider } from '../auth/AuthContext'
import DashboardLayout from './DashboardLayout'
import HomePage from '../features/home/HomePage'
import AboutPage from '../features/public/AboutPage'
import ContactPage from '../features/public/ContactPage'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import CoursesPage from '../features/courses/CoursesPage'
import FeedPage from '../features/feed/FeedPage'
import ForumPage from '../features/forum/ForumPage'
import MembershipPage from '../features/membership/MembershipPage'
import InitiumOnboardingPage from '../features/onboarding/InitiumOnboardingPage'
import AscensioOnboardingPage from '../features/onboarding/AscensioOnboardingPage'
import DominusOnboardingPage from '../features/onboarding/DominusOnboardingPage'
import ApplicationPendingPage from '../features/application/ApplicationPendingPage'
import AdminDnApplicationsPage from '../features/admin/AdminDnApplicationsPage'
import ProfilePage from '../features/profile/ProfilePage'
import { routes } from '../routes/paths'

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.hem} element={<HomePage />} />
        <Route path={routes.about} element={<AboutPage />} />
        <Route path={routes.contact} element={<ContactPage />} />
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route path={routes.membership} element={<MembershipPage />} />

          <Route element={<DashboardLayout />}>
            <Route path={routes.dashboard} element={<DashboardPage />} />
            <Route path={routes.onboardingInitium} element={<InitiumOnboardingPage />} />
            <Route path={routes.onboardingAscensio} element={<AscensioOnboardingPage />} />
            <Route path={routes.onboardingDominus} element={<DominusOnboardingPage />} />
            <Route path={routes.applicationPending} element={<ApplicationPendingPage />} />
            <Route path={routes.courses} element={<CoursesPage />} />
            <Route path={routes.feed} element={<FeedPage />} />
            <Route path={routes.forum} element={<ForumPage />} />
            <Route path={routes.profile} element={<ProfilePage />} />
            <Route
              path={routes.adminDnApplications}
              element={<RequireRole allowedRoles={['admin']} />}
            >
              <Route index element={<AdminDnApplicationsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
