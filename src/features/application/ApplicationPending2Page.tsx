import BrandPageShell from '../../components/ui/BrandPageShell'

const ApplicationPending2Page = () => (
  <BrandPageShell
    title="APPLICATION PENDING"
    subtitle="Din fullständiga onboarding granskas just nu."
    memberNav
  >
    <article className="brand-panel">
      <h3>Your application is under review.</h3>
      <p>We will notify you when a decision is made and you can complete your payment.</p>
    </article>
  </BrandPageShell>
)

export default ApplicationPending2Page
