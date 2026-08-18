import { formatCurrency, formatPercent } from '../services/api';

const HoldingsTable = ({ holdings }) => {
  if (!holdings || holdings.length === 0) {
    return <p className="text-secondary">No holdings found</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {['Symbol', 'Qty', 'Avg Price', 'Current Price', 'Cost Basis', 'Current Value', 'P&L', 'P&L %'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '0.75rem 0.5rem',
                  textAlign: h === 'Symbol' ? 'left' : 'right',
                  color: 'var(--text-secondary)',
                  fontWeight: '500',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '0.75rem 0.5rem' }}>
                <div style={{ fontWeight: '600' }}>{h.display_name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {h.sector} • {h.buy_date}
                </div>
              </td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{h.quantity}</td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{formatCurrency(h.avg_buy_price)}</td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '500' }}>{formatCurrency(h.current_price)}</td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{formatCurrency(h.cost_basis)}</td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '500' }}>{formatCurrency(h.current_value)}</td>
              <td style={{
                padding: '0.75rem 0.5rem',
                textAlign: 'right',
                fontWeight: '600',
                color: h.pnl >= 0 ? 'var(--success)' : 'var(--danger)',
              }}>
                {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)}
              </td>
              <td style={{
                padding: '0.75rem 0.5rem',
                textAlign: 'right',
                fontWeight: '600',
                color: h.pnl_pct >= 0 ? 'var(--success)' : 'var(--danger)',
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: h.pnl_pct >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  fontSize: '0.75rem',
                }}>
                  {formatPercent(h.pnl_pct)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HoldingsTable;
