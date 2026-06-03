// src/components/charts/PortfolioBarChart.jsx
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function PortfolioBarChart({ assets }) {
  if (!assets || assets.length === 0) return (
    <div className="flex items-center justify-center h-48 text-white/30">
      <p className="text-sm">Add assets to see chart</p>
    </div>
  )

  const sorted = [...assets].sort((a, b) => b.current_value - a.current_value).slice(0, 8)

  const chartData = {
    labels: sorted.map((a) => a.symbol),
    datasets: [
      {
        label: 'Current Value (₹)',
        data: sorted.map((a) => parseFloat(a.current_value).toFixed(2)),
        backgroundColor: sorted.map((a) =>
          a.pnl >= 0 ? 'rgba(0,196,140,0.7)' : 'rgba(255,75,110,0.7)'
        ),
        borderColor: sorted.map((a) => a.pnl >= 0 ? '#00c48c' : '#ff4b6e'),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161924',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${parseFloat(ctx.raw).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid:  { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: 'rgba(228,232,240,0.5)', font: { family: 'JetBrains Mono', size: 11 } },
        border: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
  grid: {
    color: 'rgba(255,255,255,0.03)'
  },

  ticks: {
    color: 'rgba(228,232,240,0.5)',

    font: {
      family: 'JetBrains Mono',
      size: 11
    },

    callback: (value) => {

      if (value >= 10000000)
        return `₹${(value / 10000000).toFixed(1)}Cr`;

      if (value >= 100000)
        return `₹${(value / 100000).toFixed(1)}L`;

      if (value >= 1000)
        return `₹${(value / 1000).toFixed(1)}K`;

      return `₹${value}`;
    }
  },

  border: {
    color: 'rgba(255,255,255,0.05)'
  },
},
    },
  }

  return (
    <div className="h-52">
      <Bar data={chartData} options={options} />
    </div>
  )
}
