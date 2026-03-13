import BrandPageShell from '../../components/ui/BrandPageShell'
import useAuth from '../../hooks/useAuth'

const VerifyPage = () => {
  const { profile } = useAuth()
  const isVerified = profile?.membershipStatus === 'active'

  return (
    <BrandPageShell title="VERIFIERING">
      <article className="brand-panel">
        <h3>Identitetsverifiering</h3>
        <p>
          Status:{' '}
          <strong style={{ color: isVerified ? '#5cd9b1' : '#ff7b7b' }}>
            {isVerified ? 'Verifierad' : 'Ej verifierad'}
          </strong>
        </p>
        <p className="muted">
          {isVerified
            ? 'Din identitet är bekräftad och ditt medlemskap är aktivt.'
            : 'Din identitet har ännu inte verifierats.'}
        </p>
        {/* TODO: Integrera BankID-verifiering här */}
        <p className="muted" style={{ marginTop: '16px', fontStyle: 'italic' }}>
          BankID-integration kommer i nästa fas.
        </p>
      </article>
    </BrandPageShell>
  )
}

export default VerifyPage