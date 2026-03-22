import BrandPageShell from '../../components/ui/BrandPageShell'

const ApplicationPending2Page = () => (
  <BrandPageShell
    title="ANSÖKAN PÅGÅR"
    subtitle="Din fullständiga onboarding granskas just nu."
    memberNav
  >
    <article className="brand-panel">
      <h3>Din ansökan granskas.</h3>
      <p>Vi meddelar dig när ett beslut har fattats och du kan slutföra din betalning.</p>
    </article>
  </BrandPageShell>
)

export default ApplicationPending2Page
