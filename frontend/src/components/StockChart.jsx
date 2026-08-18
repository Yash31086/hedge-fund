import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { getPriceHistory } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const COLORS = {
  NIFTY: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
  BANKNIFTY: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
  RELIANCE: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
};

const StockChart = ({ symbol, displayName }) => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const data = await getPriceHistory(symbol);
        setPrices(data.prices || []);
      } catch (err) {
        console.error(`Error fetching ${symbol} prices:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, [symbol]);

  if (loading) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Loading {displayName}...</p>
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>No price data for {displayName}</p>
      </div>
    );
  }

  const colorSet = COLORS[symbol] || COLORS.NIFTY;

  // Show last 60 trading days for readability
  const recentPrices = prices.slice(-60);

  const labels = recentPrices.map((p) => {
    const dt = new Date(p.date);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  });

  const latestPrice = recentPrices[recentPrices.length - 1]?.close || 0;
  const firstPrice = recentPrices[0]?.close || 0;
  const changePercent = firstPrice > 0 ? (((latestPrice - firstPrice) / firstPrice) * 100).toFixed(2) : 0;

  const data = {
    labels,
    datasets: [
      {
        label: displayName,
        data: recentPrices.map((p) => p.close),
        borderColor: colorSet.border,
        backgroundColor: colorSet.bg,
        borderWidth: 1.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: colorSet.border,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => `₹${ctx.parsed.y.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#71717a', font: { size: 9 }, maxTicksLimit: 8, maxRotation: 0 },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: '#71717a',
          font: { size: 9 },
          callback: (val) => `₹${val.toLocaleString('en-IN')}`,
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{displayName}</span>
          <span className="text-secondary" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>{symbol}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>₹{latestPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          <span style={{
            marginLeft: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: changePercent >= 0 ? 'var(--success)' : 'var(--danger)',
          }}>
            {changePercent >= 0 ? '+' : ''}{changePercent}%
          </span>
        </div>
      </div>
      <div style={{ height: '160px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default StockChart;
