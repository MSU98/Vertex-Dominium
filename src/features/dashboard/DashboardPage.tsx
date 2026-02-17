import useAuth from '../../hooks/useAuth'

const DashboardPage = () => {
  const { profile } = useAuth()

  return (
    <section className="page">
      <div className="card">
        <p className="eyebrow">Dashboard</p>
        <h2>Welcome back{profile?.email ? `, ${profile.email}` : ''}</h2>
        <p className="muted">
          Role: {profile?.role ?? 'pending'} · Membership: {profile?.membershipStatus ?? 'unknown'}
        </p>
      </div>
    </section>
  )
}

export default DashboardPage

