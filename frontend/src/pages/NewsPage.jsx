// src/pages/NewsPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import api from '../services/api'
import SentimentBadge from '../components/common/SentimentBadge'
import SentimentPieChart from '../components/charts/SentimentPieChart'
import { SkeletonNewsCard } from '../components/common/Skeleton'

const ArticleCard = ({ article, onAnalyze, isAnalyzing }) => {
  const [expanded, setExpanded] = useState(false)
  const hasAnalysis = !!article.summary

  return (
    <motion.div
      layout
      className="glass rounded-xl p-5 glass-hover cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex gap-4">
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="w-20 h-16 object-cover rounded-lg flex-shrink-0 opacity-80"
            onError={e => e.target.style.display = 'none'}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-medium text-white/90 line-clamp-2 leading-snug">{article.title}</h3>
            {hasAnalysis && <SentimentBadge sentiment={article.sentiment} />}
          </div>
          <div className="flex items-center gap-3 text-xs text-white/30 mt-2">
            <span className="font-medium text-white/50">{article.source}</span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Expanded analysis */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5">
              {hasAnalysis ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-1.5">AI Summary</p>
                    <p className="text-sm text-white/80 leading-relaxed">{article.summary}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-1.5">Investor Impact</p>
                    <p className="text-sm text-white/70 leading-relaxed">{article.impact}</p>
                  </div>
                  {article.key_points && (() => {
                    try {
                      const kp = typeof article.key_points === 'string' ? JSON.parse(article.key_points) : article.key_points
                      return kp?.length > 0 ? (
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-1.5">Key Points</p>
                          <ul className="space-y-1">
                            {kp.map((pt, i) => (
                              <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                                <span className="text-accent mt-0.5">▸</span>
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null
                    } catch { return null }
                  })()}
                  <div className="flex items-center gap-2 pt-1">
                    <SentimentBadge sentiment={article.sentiment} size="md" />
                    {article.confidence_score && (
                      <span className="text-xs text-white/30 font-mono">
                        {Math.round(article.confidence_score * 100)}% confidence
                      </span>
                    )}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="ml-auto text-xs text-accent hover:underline"
                    >
                      Read full article →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-white/40 mb-3">Not analyzed yet</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAnalyze(article.id) }}
                    disabled={isAnalyzing}
                    className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Analyzing...
                      </span>
                    ) : '✦ Analyze with AI'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function NewsPage() {
  const qc = useQueryClient()
  const [filter, setFilter]       = useState('all')   // all | Bullish | Bearish | Neutral
  const [analyzingId, setAnalyzingId] = useState(null)
  const [page, setPage]           = useState(1)

  const { data: sentimentData } = useQuery({
    queryKey: ['sentiment-stats'],
    queryFn: () => api.get('/news/stats/sentiment').then(r => r.data.data),
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['news', filter, page],
    queryFn: () => api.get(`/news?page=${page}&limit=15${filter !== 'all' ? `&sentiment=${filter}` : ''}`).then(r => r.data.data),
  })

  const fetchMutation = useMutation({
    mutationFn: () => api.post('/news/fetch'),
    onSuccess: (res) => {
      toast.success(res.data.message)
      qc.invalidateQueries(['news'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to fetch news'),
  })

  const analyzeAll = useMutation({
    mutationFn: async () => {
      const unanalyzed = (data?.articles || []).filter(a => !a.summary)
      for (const article of unanalyzed.slice(0, 5)) {
        await api.post(`/news/${article.id}/analyze`)
      }
    },
    onSuccess: () => {
      toast.success('Batch analysis complete!')
      qc.invalidateQueries(['news'])
      qc.invalidateQueries(['sentiment-stats'])
    },
    onError: () => toast.error('Some analyses failed'),
  })

  const handleAnalyze = async (id) => {
    setAnalyzingId(id)
    try {
     const res = await api.post(`/news/${id}/analyze`);

qc.setQueryData(['news', filter, page], (old) => {
  if (!old) return old;

  return {
    ...old,
    articles: old.articles.map((a) =>
      a.id === id
        ? {
            ...a,
            ...res.data.data.analysis,
          }
        : a
    ),
  };
});

toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed')
    } finally {
      setAnalyzingId(null)
    }
  }

  const articles   = data?.articles || []
  const pagination = data?.pagination || {}

  return (
    <div className="max-w-6xl space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">News Analysis</h2>
          <p className="text-white/40 text-sm mt-1">AI-powered financial news insights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => analyzeAll.mutate()}
            disabled={analyzeAll.isPending || !articles.some(a => !a.summary)}
            className="btn-ghost border border-white/10 text-sm disabled:opacity-40"
          >
            {analyzeAll.isPending ? 'Analyzing...' : '✦ Analyze All'}
          </button>
          <button
            onClick={() => fetchMutation.mutate()}
            disabled={fetchMutation.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {fetchMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Fetching...
              </span>
            ) : '↻ Fetch News'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: sentiment chart + filters */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-3">Sentiment Overview</p>
            <SentimentPieChart data={sentimentData?.overall || []} />
          </div>

          <div className="glass rounded-xl p-4 space-y-1">
            <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2">Filter</p>
            {['all', 'Bullish', 'Bearish', 'Neutral'].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  filter === f
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'All News' : f}
              </button>
            ))}
          </div>
        </div>

        {/* News list */}
        <div className="lg:col-span-3 space-y-3">
          {isLoading || isFetching ? (
            Array(5).fill(0).map((_, i) => <SkeletonNewsCard key={i} />)
          ) : articles.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center text-white/30">
              <div className="text-4xl mb-3">◎</div>
              <p className="font-medium mb-1">No news found</p>
              <p className="text-xs mb-4">Fetch news for your portfolio to get started</p>
              <button onClick={() => fetchMutation.mutate()} className="btn-primary mx-auto">
                Fetch News
              </button>
            </div>
          ) : (
            articles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ArticleCard
                  article={article}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={analyzingId === article.id}
                />
              </motion.div>
            ))
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost border border-white/10 px-4 py-2 text-sm disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-sm text-white/40 font-mono">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-ghost border border-white/10 px-4 py-2 text-sm disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
