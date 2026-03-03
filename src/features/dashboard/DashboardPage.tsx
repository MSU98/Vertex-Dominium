import useAuth from '../../hooks/useAuth'
import BrandPageShell from '../../components/ui/BrandPageShell'

const DashboardPage = () => {
  const { profile } = useAuth()

  return (
    <BrandPageShell title="DASHBOARD" subtitle="Din oversikt i medlemsportalen." memberNav>
      <article className="brand-panel">
        <p>Signed in as: {profile?.email ?? 'unknown'}</p>
        <p>Plan: {profile?.membershipPlan ?? 'none'}</p>
        <p>Status: {profile?.membershipStatus ?? 'unknown'}</p>
      </article>
    </BrandPageShell>
  )
}

export default DashboardPage
