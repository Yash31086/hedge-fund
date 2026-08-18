import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getStoredUser, logout, formatCurrency, formatPercent } from '../services/api';
import PortfolioChart from '../components/PortfolioChart';
import StockChart from '../components/StockChart';
import HoldingsTable from '../components/HoldingsTable';
import ChargesBreakdown from '../components/ChargesBreakdown';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(stored);
    fetchDashboard();
  }, [navigate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const result = await getDashboard();
      setData(result);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p className="text-secondary">Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button className="btn-primary" onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  const profile = data?.profile || {};
  const summary = data?.portfolio_summary || {};
  const market = data?.market_status || {};
  const holdings = data?.holdings || [];
  const charges = data?.charges || {};
  const investmentHistory = data?.investment_history || [];
  const portfolioHistory = data?.portfolio_history || [];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'history', label: 'History' },
    { id: 'charges', label: 'Charges' },
    { id: 'charts', label: 'Charts' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{
        width: '300px', margin: '1rem', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: '1rem', height: 'calc(100vh - 2rem)', overflow: 'auto',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.25rem' }}>BLACKBUSER</h2>
          <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>Investor Portal</p>
        </div>

        {/* Profile Card */}
        <div style={{
          marginBottom: '1.5rem', padding: '1rem',
          background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.125rem' }}>{profile.full_name}</h3>
          <p className="text-secondary" style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{profile.email}</p>

          {/* Market Status Badge */}
          <span style={{
            display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
            fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.05em',
            background: market.status === 'LIVE'
              ? 'rgba(16, 185, 129, 0.2)' : market.status === 'HOLIDAY'
              ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: market.status === 'LIVE'
              ? 'var(--success)' : market.status === 'HOLIDAY'
              ? 'var(--warning)' : 'var(--danger)',
          }}>
            {market.status === 'LIVE' ? '● LIVE' : market.label || market.status}
          </span>

          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-tertiary">Portfolio Status:</span>
              <span style={{ fontWeight: '600' }}>Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-tertiary">Last Sync:</span>
              <span className="text-secondary">{summary.last_sync}</span>
            </div>
          </div>
        </div>

        {/* Investor Info */}
        <div style={{
          marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem',
          fontSize: '0.75rem', color: 'var(--text-secondary)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Investor ID</span><span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{profile.investor_id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Account Type</span><span>{profile.account_type}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>KYC</span>
            <span style={{ color: 'var(--success)', fontWeight: '600' }}>{profile.kyc_status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Risk Profile</span><span style={{ color: 'var(--warning)', fontWeight: '600' }}>{profile.risk_profile}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Client Since</span><span>{profile.client_since}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                textAlign: 'left', fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? '600' : '400',
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
                border: activeTab === tab.id ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} style={{
          padding: '0.625rem 0.875rem', color: 'var(--text-tertiary)', textAlign: 'left',
          marginTop: 'auto', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)',
          transition: 'color 0.15s',
        }}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 2rem 2rem 1rem', overflow: 'auto' }}>
        {/* Holiday Banner */}
        {data?.is_holiday && data?.holiday_name && (
          <div className="animate-fade-in" style={{
            padding: '0.75rem 1.25rem', marginBottom: '1.5rem',
            background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.25rem' }}>🏖</span>
            <div>
              <span style={{ fontWeight: '600', color: 'var(--warning)' }}>Market Holiday</span>
              <span className="text-secondary" style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                — {data.holiday_name}. Portfolio values based on last trading day.
              </span>
            </div>
          </div>
        )}

        <header className="flex-between" style={{ marginBottom: '2rem' }}>
          <div>
            <p className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              Institutional Investor Workspace
            </p>
            <h1 style={{ fontSize: '1.75rem' }}>Investor Dashboard</h1>
          </div>
          <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
            {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            {/* Profile + Portfolio Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Investor Profile Card */}
              <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.9375rem' }}>Investor profile</h3>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.6875rem',
                    fontWeight: '700', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)',
                  }}>Active</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Investor ID</span>
                    <span style={{ fontWeight: '600' }}>{profile.investor_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Account Type</span>
                    <span>{profile.account_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">KYC Status</span>
                    <span style={{ color: 'var(--success)' }}>{profile.kyc_status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Risk Profile</span>
                    <span style={{ color: 'var(--warning)' }}>{profile.risk_profile}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Holding Period</span>
                    <span>{summary.holding_period}</span>
                  </div>
                </div>
              </div>

              {/* Portfolio Summary Card */}
              <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.9375rem' }}>Portfolio summary</h3>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.6875rem',
                    fontWeight: '700',
                    background: summary.overall_return >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: summary.overall_return >= 0 ? 'var(--success)' : 'var(--danger)',
                  }}>{formatPercent(summary.overall_return || 0)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Capital Invested</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(summary.total_invested)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Gross Portfolio Value</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(summary.gross_value)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Total Charges</span>
                    <span style={{ color: 'var(--danger)' }}>-{formatCurrency(charges.total_charges)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: '600' }}>Net Portfolio Value</span>
                    <span style={{ fontWeight: '700', color: 'var(--success)', fontSize: '1rem' }}>{formatCurrency(summary.net_value)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Capital Invested', value: formatCurrency(summary.total_invested), icon: '💰' },
                { label: 'Net Value', value: formatCurrency(summary.net_value), icon: '📊' },
                { label: 'Net Profit', value: formatCurrency(summary.net_profit), highlight: true, icon: '📈' },
                { label: 'Overall Return', value: formatPercent(summary.overall_return || 0), highlight: true, icon: '🎯' },
              ].map((stat, i) => (
                <div key={i} className="glass-panel animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</span>
                    <span style={{ fontSize: '1.25rem' }}>{stat.icon}</span>
                  </div>
                  <div style={{
                    fontSize: '1.375rem', fontWeight: '700',
                    color: stat.highlight ? (summary.net_profit >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-primary)',
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Portfolio Performance Chart */}
            <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem', animationDelay: '0.3s' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Portfolio Performance</h3>
              <PortfolioChart history={portfolioHistory} investedAmount={summary.total_invested} />
            </div>

            {/* Holdings Preview + Investment History */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Holdings</h3>
                <HoldingsTable holdings={holdings} />
              </div>

              <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Investment History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {investmentHistory.map((inv, i) => (
                    <div key={i} style={{
                      padding: '0.75rem', background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{inv.description || inv.date}</span>
                        <span style={{
                          fontSize: '0.6875rem', padding: '0.125rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)',
                        }}>{inv.status}</span>
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>{inv.date}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                        <span>Invested: {formatCurrency(inv.amount)}</span>
                        <span style={{ color: inv.profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                          {formatPercent(inv.return_pct)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'holdings' && (
          <div className="animate-fade-in">
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Current Holdings</h3>
              <HoldingsTable holdings={holdings} />
            </div>

            {/* Allocation */}
            {data?.allocation && data.allocation.length > 0 && (
              <div className="glass-panel">
                <h3 style={{ marginBottom: '1rem' }}>Sector Allocation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {data.allocation.map((alloc, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                        <span>{alloc.name}</span>
                        <span style={{ fontWeight: '600' }}>{alloc.value}%</span>
                      </div>
                      <div style={{
                        height: '6px', borderRadius: '3px',
                        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${alloc.value}%`, height: '100%', borderRadius: '3px',
                          background: i === 0 ? 'var(--accent-primary)' : i === 1 ? 'var(--accent-secondary)' : i === 2 ? 'var(--success)' : 'var(--warning)',
                          transition: 'width 0.6s ease-out',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.5rem' }}>Investment History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['Date', 'Description', 'Invested', 'Current Value', 'Profit', 'Return', 'Status'].map((h) => (
                        <th key={h} style={{
                          padding: '0.75rem 0.5rem', textAlign: 'left',
                          color: 'var(--text-secondary)', fontWeight: '500',
                          fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {investmentHistory.map((inv, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{inv.date}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{inv.description}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{formatCurrency(inv.amount)}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{formatCurrency(inv.current_value)}</td>
                        <td style={{
                          padding: '0.75rem 0.5rem', fontWeight: '600',
                          color: inv.profit >= 0 ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {inv.profit >= 0 ? '+' : ''}{formatCurrency(inv.profit)}
                        </td>
                        <td style={{
                          padding: '0.75rem 0.5rem', fontWeight: '600',
                          color: inv.return_pct >= 0 ? 'var(--success)' : 'var(--danger)',
                        }}>{formatPercent(inv.return_pct)}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
                            fontSize: '0.6875rem', fontWeight: '600',
                            background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)',
                          }}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charges' && (
          <div className="animate-fade-in">
            <div className="glass-panel" style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Charges & Fees Breakdown</h3>
              <ChargesBreakdown charges={charges} />
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="animate-fade-in">
            <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Portfolio Value Over Time</h3>
              <PortfolioChart history={portfolioHistory} investedAmount={summary.total_invested} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
              {holdings.map((h, i) => (
                <div key={i} className="glass-panel animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <StockChart symbol={h.symbol} displayName={h.display_name} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
