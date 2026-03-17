import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import type { PortalModule } from '../../types/Access'
import { routes } from '../../routes/paths'

const modules: { key: PortalModule; label: string; to: string; note: string }[] = [
  {
    key: 'dashboard',
    label: 'Översikt',
    to: routes.dashboard,
    note: 'Din personliga överblick och viktiga uppdateringar.',
  },
  {
    key: 'courses',
    label: 'Kurser',
    to: routes.courses,
    note: 'Utbildning, träning och certifikat.',
  },
  {
    key: 'feed',
    label: 'Flöde',
    to: routes.feed,
    note: 'Utvalda uppdateringar från nätverket.',
  },
  {
    key: 'forum',
    label: 'Forum',
    to: routes.forum,
    note: 'Samtal och diskussioner mellan medlemmar.',
  },
  {
    key: 'profile',
    label: 'Profil',
    to: routes.profile,
    note: 'Dina kontakt- och kontouppgifter.',
  },
  {
    key: 'dominusArea',
    label: 'Dominus-rum',
    to: routes.dashboard,
    note: 'Privat tillgång för den högsta medlemsnivån.',
  },
]

const planToneMap: Record<string, string> = {
  initium: 'tier-initium',
  ascensio: 'tier-ascensio',
  dominus: 'tier-dominus',
  none: 'tier-none',
}

const toLabel = (value: string | null | undefined) => {
  if (!value) return 'Ingen'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const toDisplayName = (fullName: string | undefined, email: string | undefined) => {
  if (fullName?.trim()) return fullName.trim()
  if (!email) return 'Medlem'

  return email
    .split('@')[0]
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const DashboardPage = () => {
  const { profile } = useAuth()
  const { canAccess } = useModuleAccess()

  const completionFields = [
    profile?.fullName,
    profile?.city,
    profile?.title,
    profile?.phone,
    profile?.company,
    profile?.linkedin,
    profile?.professionalDescription,
    profile?.interests?.length ? 'yes' : '',
  ]

  const completedCount = completionFields.filter(Boolean).length
  const completionPercent = Math.round((completedCount / completionFields.length) * 100)
  const displayName = toDisplayName(profile?.fullName, profile?.email)
  const planKey = profile?.membershipPlan ?? 'none'
  const planClass = planToneMap[planKey] ?? 'tier-none'

  const contactRows = [
    { label: 'E-post', value: profile?.email ?? 'Inte tillagd än' },
    { label: 'Telefon', value: profile?.phone ?? 'Lägg till ditt telefonnummer' },
    { label: 'Stad', value: profile?.city ?? 'Lägg till din stad' },
    { label: 'Företag', value: profile?.company ?? 'Lägg till ditt företag' },
  ]

  const nextStep = (() => {
    if (profile?.role === 'admin') {
      return {
        to: routes.adminReviews,
        label: 'Granska ansökningar',
        hint: 'Se och hantera inkommande medlemsansökningar.',
      }
    }

    if (profile?.membershipStatus === 'inactive') {
      return {
        to: routes.membership,
        label: 'Förnya medlemskap',
        hint: 'Ditt medlemskap är inaktivt. Välj en plan för att återaktivera.',
      }
    }

    if (!profile?.membershipPlan) {
      return {
        to: routes.membership,
        label: 'Välj medlemskap',
        hint: 'Välj din nivå för att låsa upp rätt medlemsupplevelse.',
      }
    }

    if (profile.membershipStatus !== 'active') {
      if (profile.membershipPlan === 'dominus' && profile.membershipStatus === 'pending') {
        return {
          to: routes.applicationPending,
          label: 'Se ansökningsstatus',
          hint: 'Din Dominus-ansökan väntar på granskning.',
        }
      }

      if (profile.membershipPlan === 'dominus' && profile.membershipStatus === 'approved') {
        return {
          to: `${routes.payment}?planId=dominus`,
          label: 'Slutför betalning',
          hint: 'Din ansökan är godkänd! Slutför betalningen för att aktivera ditt medlemskap.',
        }
      }
      if (profile.membershipStatus === 'pending' && profile.membershipPlan !== 'dominus') {
        return {
          to: `${routes.payment}?planId=${profile.membershipPlan}`,
          label: 'Slutför betalning',
          hint: 'Slutför betalningen för att aktivera ditt medlemskap.',
        }
      }

      return {
        to: routes.membership,
        label: 'Uppdatera medlemskap',
        hint: 'Medlemskapet måste vara aktivt innan premiumdelar öppnas.',
      }
    }

    if (!profile.onboardingComplete) {
      const onboardingRoute =
        profile.membershipPlan === 'ascensio'
          ? routes.onboardingAscensio
          : profile.membershipPlan === 'dominus'
            ? routes.onboardingDominus
            : routes.onboardingInitium

      return {
        to: onboardingRoute,
        label: 'Slutför onboarding',
        hint: 'Slutför onboarding för att aktivera hela din profil.',
      }
    }

    return {
      to: routes.profile,
      label: 'Uppdatera din profil',
      hint: 'Håll dina kontaktuppgifter och din professionella profil uppdaterad.',
    }
  })()

  return (
    <BrandPageShell title="DASHBOARD" subtitle="Din översikt i medlemsportalen." memberNav>
      <section className="page dashboard-page">
        <div className="dashboard-hero card">
          <div className="hero-copy">
            <p className="eyebrow">Översikt</p>
            <p className="dashboard-subtitle">
              Din medlemsportal för nätverk, utbildning och profilhantering.
            </p>
          </div>

          <div className="hero-meta">
            <p className="eyebrow">Medlem</p>
            {profile?.avatarUrl ? (
              <img className="hero-avatar" src={profile.avatarUrl} alt={displayName} />
            ) : null}
            <h1 className="dashboard-title">{displayName}</h1>
            <span className={`tier-badge ${planClass}`}>{toLabel(profile?.membershipPlan)}</span>
            <p className="hero-email">{profile?.email ?? 'Ingen e-post kopplad'}</p>
          </div>
        </div>

        <div className="dashboard-summary-grid">
          <div className="summary-card card">
            <p className="eyebrow">Roll</p>
            <h3>{toLabel(profile?.role)}</h3>
            <p className="muted">Din interna åtkomstnivå.</p>
          </div>
          <div className="summary-card card">
            <p className="eyebrow">Plan</p>
            <h3>{toLabel(profile?.membershipPlan)}</h3>
            <p className="muted">Initium, Ascensio eller Dominus.</p>
          </div>
          <div className="summary-card card">
            <p className="eyebrow">Status</p>
            <h3>{toLabel(profile?.membershipStatus)}</h3>
            <p className="muted">Nuvarande aktiveringsläge.</p>
          </div>
          <div className="summary-card card">
            <p className="eyebrow">Profilgrad</p>
            <h3>{completionPercent}%</h3>
            <div className="progress-track">
              <span className="progress-bar" style={{ width: `${completionPercent}%` }} />
            </div>
            <p className="muted">
              {completedCount}/{completionFields.length} fält ifyllda
            </p>
          </div>
        </div>

        <div className="dashboard-main-grid">
          <div className="card spotlight-card">
            <p className="eyebrow">Nästa steg</p>
            <h3>{nextStep.label}</h3>
            <p className="muted">{nextStep.hint}</p>
            <div className="actions">
              <Link className="btn primary" to={nextStep.to}>
                Fortsätt
              </Link>
            </div>
          </div>

          <div className="card contact-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Medlemsuppgifter</p>
                <h3>Kontaktprofil</h3>
              </div>
              <Link className="btn ghost" to={routes.profile}>
                Redigera profil
              </Link>
            </div>

            <div className="contact-grid">
              {contactRows.map((row) => (
                <div key={row.label} className="contact-row">
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card membership-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Medlemsnivåer</p>
              <h3>Åtkomstnivåer</h3>
            </div>
            <Link className="btn ghost" to={routes.membership}>
              Se nivåer
            </Link>
          </div>

          <div className="tier-grid">
            <article className={`tier-panel ${planKey === 'initium' ? 'active' : ''}`}>
              <p className="tier-name">Initium</p>
              <p className="tier-copy">
                Grundläggande tillgång för medlemmar som kliver in i nätverket.
              </p>
            </article>
            <article className={`tier-panel ${planKey === 'ascensio' ? 'active' : ''}`}>
              <p className="tier-name">Ascensio</p>
              <p className="tier-copy">
                Utökad tillgång för medlemmar med en bredare deltagandenivå.
              </p>
            </article>
            <article className={`tier-panel ${planKey === 'dominus' ? 'active' : ''}`}>
              <p className="tier-name">Dominus</p>
              <p className="tier-copy">
                Högsta nivån med premiumtillgång och privata medlemsfördelar.
              </p>
            </article>
          </div>
        </div>

        <div className="card module-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Modulåtkomst</p>
              <h3>Tillgängliga ytor</h3>
            </div>
            <p className="muted">Låsta moduler öppnas genom rätt medlemsnivå.</p>
          </div>

          <div className="module-grid">
            {modules.map((item) => {
              const unlocked = canAccess(item.key)

              return (
                <article key={item.key} className="module-card">
                  <div className="module-card-top">
                    <h3>{item.label}</h3>
                    <span className={`module-status ${unlocked ? 'open' : 'locked'}`}>
                      {unlocked ? 'Öppet' : 'Låst'}
                    </span>
                  </div>
                  <p className="muted">{item.note}</p>
                  <Link
                    className="btn ghost module-link"
                    to={unlocked ? item.to : routes.membership}
                  >
                    {unlocked ? 'Öppna modul' : 'Hantera åtkomst'}
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </BrandPageShell>
  )
}

export default DashboardPage
