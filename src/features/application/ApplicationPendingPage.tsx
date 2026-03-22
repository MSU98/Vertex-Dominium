import BrandPageShell from '../../components/ui/BrandPageShell'

const ApplicationPendingPage = () => (
  <BrandPageShell
    title="ANSÖKAN PÅGÅR"
    subtitle="Din Dominus Negotium-ansökan granskas just nu."
    memberNav
  >
    <article className="brand-panel">
      <h3>Din ansökan granskas.</h3>
      <p>Vi meddelar dig när ett beslut har fattats.</p>
    </article>
  </BrandPageShell>
)

export default ApplicationPendingPage
