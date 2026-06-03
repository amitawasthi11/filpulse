// src/components/charts/SentimentPieChart.jsx
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function SentimentPieChart({ data }) {
  // data: [{ sentiment: 'Bullish', count: 5 }, ...]
  const sentiments = { Bullish: 0, Bearish: 0, Neutral: 0 }
  data?.forEach((d) => { sentiments[d.sentiment] = parseInt(d.count) })

  const total = Object.values(sentiments).reduce((a, b) => a + b, 0)

  const chartData = {
    labels: ['Bullish', 'Bearish', 'Neutral'],
    datasets: [{
      data: [sentiments.Bullish, sentiments.Bearish, sentiments.Neutral],
      backgroundColor: ['rgba(0,196,140,0.85)', 'rgba(255,75,110,0.85)', 'rgba(123,134,168,0.85)'],
      borderColor: ['#00c48c', '#ff4b6e', '#7b86a8'],
      borderWidth: 1.5,
      hoverOffset: 8,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(228,232,240,0.7)',
          font: { family: 'DM Sans', size: 12 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#161924',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0
            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`
          },
        },
      },
    },
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-white/30">
        <span className="text-3xl mb-2">◎</span>
        <p className="text-sm">No sentiment data yet</p>
        <p className="text-xs mt-1">Analyze news to see trends</p>
      </div>
    )
  }

  return (
    <div className="relative h-52">
      <Pie data={chartData} options={options} />
    </div>
  )
}
