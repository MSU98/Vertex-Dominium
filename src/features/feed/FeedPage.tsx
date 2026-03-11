import BrandPageShell from '../../components/ui/BrandPageShell'

const FeedPage = () => (
  <BrandPageShell
    title="FLÖDE"
    subtitle="Medlemsuppdateringar och aktivitet i nätverket."
    memberNav
  >
    <article className="brand-panel">
      <p>Plats för aktivitetsflöde. Koppla till Firestore-samlingar senare.</p>
    </article>
  </BrandPageShell>
)

export default FeedPage
