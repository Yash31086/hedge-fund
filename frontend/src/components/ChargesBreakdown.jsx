import { formatCurrency } from '../services/api';

const ChargesBreakdown = ({ charges }) => {
  if (!charges) return null;

  const items = [
    { label: 'Brokerage', value: charges.brokerage, desc: 'Trading commission' },
    { label: 'STT (Securities Transaction Tax)', value: charges.stt, desc: 'Government levy on securities' },
    { label: 'Exchange Transaction Charges', value: charges.exchange_charges, desc: 'NSE/BSE fees' },
    { label: 'SEBI Charges', value: charges.sebi_charges, desc: 'Regulatory fee' },
    { label: 'Stamp Duty', value: charges.stamp_duty, desc: 'State stamp duty' },
    { label: 'GST', value: charges.gst, desc: 'On brokerage + charges' },
    { label: 'Platform Fee', value: charges.platform_fee, desc: 'BLACKBUSER service fee' },
    { label: 'Infrastructure (AWS)', value: charges.aws_fee, desc: 'Cloud hosting cost' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.625rem 0.75rem',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
          >
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: '500' }}>{item.label}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>{item.desc}</div>
            </div>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: item.value > 0 ? 'var(--warning)' : 'var(--text-secondary)',
            }}>
              {item.value > 0 ? `- ${formatCurrency(item.value)}` : formatCurrency(0)}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.875rem 0.75rem',
        marginTop: '0.75rem',
        background: 'rgba(239, 68, 68, 0.06)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
      }}>
        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Total Charges</div>
        <div style={{ fontWeight: '700', color: 'var(--danger)', fontSize: '0.9375rem' }}>
          - {formatCurrency(charges.total_charges)}
        </div>
      </div>
    </div>
  );
};

export default ChargesBreakdown;
