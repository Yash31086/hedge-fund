import { useEffect, useRef } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const PortfolioChart = ({ history, investedAmount }) => {
  if (!history || history.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-secondary">No portfolio data available yet</p>
      </div>
    );
  }

  // Filter out weekends for cleaner chart, keep holidays marked
  const labels = history.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Portfolio Value',
        data: history.map((d) => d.portfolio_value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#3b82f6',
      },
      {
        label: 'Invested Amount',
        data: history.map((d) => d.invested_amount),
        borderColor: 'rgba(161, 161, 170, 0.5)',
        borderWidth: 1.5,
        borderDash: [6, 4],
        fill: false,
        tension: 0,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#a1a1aa',
          font: { family: 'Inter', size: 11 },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 11 },
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            return `${ctx.dataset.label}: ₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
          },
          afterBody: (items) => {
            if (items.length > 0) {
              const idx = items[0].dataIndex;
              const entry = history[idx];
              if (entry && entry.is_holiday && entry.holiday_name) {
                return `\n🏖 ${entry.holiday_name}`;
              }
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#71717a',
          font: { family: 'Inter', size: 10 },
          maxTicksLimit: 15,
          maxRotation: 0,
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: '#71717a',
          font: { family: 'Inter', size: 10 },
          callback: (val) => `₹${(val / 1000).toFixed(0)}k`,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
        },
      },
    },
  };

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default PortfolioChart;
