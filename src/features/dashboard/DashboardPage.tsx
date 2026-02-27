import useAuth from '../../hooks/useAuth'

const DashboardPage = () => {
  const { profile } = useAuth()

  return (
    <section className="page">
      <div className="card">
        <p className="eyebrow">Dashboard</p>
        <h2>Operational dashboard</h2>
        <p className="muted">Signed in as: {profile?.email ?? 'unknown'}</p>
        <p className="muted">Plan: {profile?.membershipPlan ?? 'none'}</p>
        <p className="muted">Status: {profile?.membershipStatus ?? 'unknown'}</p>
      </div>
    </section>
  )
}

export default DashboardPage
