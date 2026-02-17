import useAuth from '../../hooks/useAuth'

const ProfilePage = () => {
  const { profile } = useAuth()

  return (
    <section className="page">
      <div className="card">
        <p className="eyebrow">Profile</p>
        <h2>{profile?.fullName ?? 'Member profile'}</h2>
        <p className="muted">Basic profile placeholder.</p>
      </div>
    </section>
  )
}

export default ProfilePage
