import BrandPageShell from '../../components/ui/BrandPageShell'

const SubscribePage = () => (
  <BrandPageShell title="VÄLJ BETALNING">
    <article className="brand-panel">
      <h3>Välj betalningsmetod</h3>
      <p className="muted">Välj hur du vill betala för ditt medlemskap.</p>

      <div className="brand-panel-grid" style={{ marginTop: '16px', gap: '12px' }}>
        <div className="brand-panel-sub">
          <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Klarna</h3>
          <p className="muted">Betala enkelt med Klarna — delbetalning eller direktbetalning.</p>
          {/* TODO: Integrera Klarna checkout här */}
          <button className="btn ghost" style={{ marginTop: '12px' }} disabled>
            Betala med Klarna (kommer snart)
          </button>
        </div>

        <div className="brand-panel-sub">
          <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Direktbetalning</h3>
          <p className="muted">Betala direkt via banköverföring.</p>
          {/* TODO: Integrera direktbetalning här */}
          <button className="btn ghost" style={{ marginTop: '12px' }} disabled>
            Direktbetalning (kommer snart)
          </button>
        </div>
      </div>
    </article>
  </BrandPageShell>
)

export default SubscribePage