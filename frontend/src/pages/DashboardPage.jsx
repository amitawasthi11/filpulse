// src/pages/DashboardPage.jsx
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../services/api'
import SentimentPieChart from '../components/charts/SentimentPieChart'
import PortfolioBarChart from '../components/charts/PortfolioBarChart'
import SentimentBadge   from '../components/common/SentimentBadge'
import { SkeletonCard, SkeletonText }  from '../components/common/Skeleton'
import useAuthStore from '../context/authStore'

const StatCard = ({ label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="stat-card"
  >
    <p className="text-xs text-white/40 uppercase tracking-widest font-mono mb-1">{label}</p>
    <p className={`text-2xl font-display font-bold ${color || 'text-white'} leading-tight`}>{value}</p>
    {sub && <p className="text-xs text-white/30 mt-1 font-mono">{sub}</p>}
  </motion.div>
)

const fmt = (n) => {
  if (n == null) return '—'

  const abs = Math.abs(n)

  if (abs >= 1e7)
    return `₹${(n / 1e7).toFixed(2)}Cr`

  if (abs >= 1e5)
    return `₹${(n / 1e5).toFixed(2)}L`

  if (abs >= 1e3)
    return `₹${(n / 1e3).toFixed(2)}K`

  return `₹${parseFloat(n).toFixed(2)}`
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: portfolio, isLoading: portLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/portfolio').then((r) => r.data.data),
  })

  const { data: sentimentStats, isLoading: sentimentLoading } = useQuery({
    queryKey: ['sentiment-stats'],
    queryFn: () => api.get('/news/stats/sentiment').then((r) => r.data.data),
  })

  const { data: recentNews, isLoading: newsLoading } = useQuery({
    queryKey: ['recent-news'],
    queryFn: () => api.get('/news?limit=5').then((r) => r.data.data),
  })

  const summary = portfolio?.summary || {}
  const assets  = portfolio?.assets || []
  const pnlUp   = (summary.total_pnl || 0) >= 0

  return (
    <div className="space-y-6 page-transition max-w-7xl">
      {/* Welcome */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
          <span className="text-accent">{user?.name?.split(' ')[0] || 'Investor'}</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">Here's your portfolio at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {portLoading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Portfolio Value"  value={fmt(summary.total_value)} sub={`${assets.length} assets`} delay={0} />
            <StatCard label="Total Cost"       value={fmt(summary.total_cost)}  sub="Invested" delay={0.05} />
            <StatCard
              label="P&L"
              value={`${pnlUp ? '+' : ''}${fmt(summary.total_pnl)}`}
              sub={`${pnlUp ? '+' : ''}${(summary.total_pnl_percent || 0).toFixed(2)}%`}
              color={pnlUp ? 'text-bull' : 'text-bear'}
              delay={0.1}
            />
            <StatCard label="Assets" value={assets.length} sub="In portfolio" delay={0.15} />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">Sentiment Distribution</h3>
              <p className="text-xs text-white/30 mt-0.5">Based on analyzed news</p>
            </div>
            <Link to="/news" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {sentimentLoading
            ? <div className="skeleton h-48 rounded-lg" />
            : <SentimentPieChart data={sentimentStats?.overall || []} />
          }
        </motion.div>

        {/* Portfolio bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">Asset Allocation</h3>
              <p className="text-xs text-white/30 mt-0.5">By current value</p>
            </div>
            <Link to="/portfolio" className="text-xs text-accent hover:underline">Manage →</Link>
          </div>
          {portLoading
            ? <div className="skeleton h-48 rounded-lg" />
            : <PortfolioBarChart assets={assets} />
          }
        </motion.div>
      </div>

      {/* Holdings & Recent news */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top holdings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Holdings</h3>
            <Link to="/portfolio" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {portLoading ? <SkeletonText lines={5} /> : (
            assets.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <p className="text-2xl mb-2">◈</p>
                <p className="text-sm">No assets yet</p>
                <Link to="/portfolio" className="text-xs text-accent mt-2 inline-block hover:underline">
                  Add your first asset →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold font-mono text-accent">
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white font-mono">{asset.symbol}</p>
                        <p className="text-xs text-white/30">{asset.quantity} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white">{fmt(asset.current_value)}</p>
                      <p className={`text-xs font-mono ${asset.pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                        {asset.pnl >= 0 ? '+' : ''}{asset.pnl_percent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </motion.div>

        {/* Recent news */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Recent Analysis</h3>
            <Link to="/news" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {newsLoading ? <SkeletonText lines={5} /> : (
            !recentNews?.articles?.length ? (
              <div className="text-center py-8 text-white/30">
                <p className="text-2xl mb-2">◎</p>
                <p className="text-sm">No news analyzed yet</p>
                <Link to="/news" className="text-xs text-accent mt-2 inline-block hover:underline">
                  Fetch news →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNews.articles.map((article) => (
                  <div key={article.id} className="group py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white/80 line-clamp-2 group-hover:text-white transition-colors leading-snug">
                        {article.title}
                      </p>
                      {article.sentiment && <SentimentBadge sentiment={article.sentiment} />}
                    </div>
                    <p className="text-xs text-white/30 mt-1">{article.source}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  )
}
