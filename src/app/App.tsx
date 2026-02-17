import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import RequireAuth from '../auth/RequireAuth'
import RequireRole from '../auth/RequireRole'
import RequireModuleAccess from '../auth/RequireModuleAccess'
import DashboardLayout from './DashboardLayout'
import PublicLayout from './PublicLayout'
import LandingPage from '../features/public/LandingPage'
import AboutPage from '../features/public/AboutPage'
import ContactPage from '../features/public/ContactPage'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import MemberHomePage from '../features/home/MemberHomePage'
import DashboardPage from '../features/dashboard/DashboardPage'
import CoursesPage from '../features/courses/CoursesPage'
import FeedPage from '../features/feed/FeedPage'
import ForumPage from '../features/forum/ForumPage'
import ProfilePage from '../features/profile/ProfilePage'
import MembershipPage from '../features/membership/MembershipPage'
import InitiumOnboardingPage from '../features/onboarding/InitiumOnboardingPage'
import AscensioOnboardingPage from '../features/onboarding/AscensioOnboardingPage'
import DominusOnboardingPage from '../features/onboarding/DominusOnboardingPage'
import ApplicationPendingPage from '../features/application/ApplicationPendingPage'
import AdminDnApplicationsPage from '../features/admin/AdminDnApplicationsPage'
import DominusAreaPage from '../features/dominus/DominusAreaPage'
import { routes } from '../routes/paths'

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={routes.landing} element={<LandingPage />} />
          <Route path={routes.about} element={<AboutPage />} />
          <Route path={routes.contact} element={<ContactPage />} />
        </Route>

        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route path={routes.membership} element={<MembershipPage />} />
          <Route path={routes.onboardingInitium} element={<InitiumOnboardingPage />} />
          <Route path={routes.onboardingAscensio} element={<AscensioOnboardingPage />} />
          <Route path={routes.onboardingDominus} element={<DominusOnboardingPage />} />
          <Route path={routes.applicationPending} element={<ApplicationPendingPage />} />

          <Route element={<DashboardLayout />}>
            <Route path={routes.appHome} element={<MemberHomePage />} />

            <Route path={routes.dashboard} element={<RequireModuleAccess module="dashboard" />}>
              <Route index element={<DashboardPage />} />
            </Route>
            <Route path={routes.courses} element={<RequireModuleAccess module="courses" />}>
              <Route index element={<CoursesPage />} />
            </Route>
            <Route path={routes.feed} element={<RequireModuleAccess module="feed" />}>
              <Route index element={<FeedPage />} />
            </Route>
            <Route path={routes.forum} element={<RequireModuleAccess module="forum" />}>
              <Route index element={<ForumPage />} />
            </Route>
            <Route path={routes.profile} element={<RequireModuleAccess module="profile" />}>
              <Route index element={<ProfilePage />} />
            </Route>
            <Route path={routes.dominusArea} element={<RequireModuleAccess module="dominusArea" />}>
              <Route index element={<DominusAreaPage />} />
            </Route>
            <Route element={<RequireRole allowedRoles={['admin']} />}>
              <Route path={routes.adminDnApplications} element={<AdminDnApplicationsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
