import SplashScreen from '../features/auth/SplashScreen'
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
import VerifyPage from '../features/auth/VerifyPage'
import SubscribePage from '../features/auth/SubscribePage'
import DashboardPage from '../features/dashboard/DashboardPage'
import CoursesPage from '../features/courses/CoursesPage'
import FeedPage from '../features/feed/FeedPage'
import ForumPage from '../features/forum/ForumPage'
import MessagesPage from '../features/messages/MessagesPage'
import MembershipPage from '../features/membership/MembershipPage'
import PaymentPage from '../features/payment/PaymentPage'
import InitiumOnboardingPage from '../features/onboarding/InitiumOnboardingPage'
import AscensioOnboardingPage from '../features/onboarding/AscensioOnboardingPage'
import DominusOnboardingPage from '../features/onboarding/DominusOnboardingPage'
import DominusOnboarding2Page from '../features/onboarding/DominusOnboarding2Page'
import ApplicationPendingPage from '../features/application/ApplicationPendingPage'
import ApplicationPending2Page from '../features/application/ApplicationPending2Page'
import AdminDnApplicationsPage from '../features/admin/AdminDnApplicationsPage'
import AdminDnApplications2Page from '../features/admin/AdminDnApplications2Page'
import ProfilePage from '../features/profile/ProfilePage'
import PublicProfilePage from '../features/profile/PublicProfilePage'
import PublicSharedProfilePage from '../features/profile/PublicSharedProfilePage'
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
        <Route path={routes.membership} element={<MembershipPage />} />
        <Route path={routes.publicShareProfile} element={<PublicSharedProfilePage />} />

        <Route element={<RequireAuth />}>
          <Route path={routes.splash} element={<SplashScreen />} /> {/* ← här */}
          <Route path={routes.payment} element={<PaymentPage />} />
          <Route path={routes.verify} element={<VerifyPage />} />
          <Route path={routes.subscribe} element={<SubscribePage />} />
          <Route element={<DashboardLayout />}>
            <Route path={routes.dashboard} element={<DashboardPage />} />
            <Route path={routes.onboardingInitium} element={<InitiumOnboardingPage />} />
            <Route path={routes.onboardingAscensio} element={<AscensioOnboardingPage />} />
            <Route path={routes.onboardingDominus} element={<DominusOnboardingPage />} />
            <Route path={routes.onboardingDominus2} element={<DominusOnboarding2Page />} />
            <Route path={routes.applicationPending} element={<ApplicationPendingPage />} />
            <Route path={routes.applicationPending2} element={<ApplicationPending2Page />} />
            <Route path={routes.courses} element={<CoursesPage />} />
            <Route path={routes.feed} element={<FeedPage />} />
            <Route path={routes.forum} element={<ForumPage />} />
            <Route path={routes.messages} element={<MessagesPage />} />
            <Route path={routes.profile} element={<ProfilePage />} />
            <Route path={routes.publicProfile} element={<PublicProfilePage />} />
            <Route path={routes.adminReviews} element={<RequireRole allowedRoles={['admin']} />}>
              <Route index element={<AdminDnApplicationsPage />} />
            </Route>
            <Route
              path={routes.adminDnApplications}
              element={<RequireRole allowedRoles={['admin']} />}
            >
              <Route index element={<AdminDnApplicationsPage />} />
            </Route>
            <Route
              path={routes.adminDnApplications2}
              element={<RequireRole allowedRoles={['admin']} />}
            >
              <Route index element={<AdminDnApplications2Page />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
