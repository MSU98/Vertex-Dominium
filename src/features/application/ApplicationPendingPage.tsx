import BrandPageShell from '../../components/ui/BrandPageShell'

const ApplicationPendingPage = () => (
  <BrandPageShell
    title="APPLICATION PENDING"
    subtitle="Dominus Negotium ansokan granskas just nu."
    memberNav
  >
    <article className="brand-panel">
      <h3>Your application is under review.</h3>
      <p>We will notify you when a decision is made.</p>
    </article>
  </BrandPageShell>
)

export default ApplicationPendingPage
