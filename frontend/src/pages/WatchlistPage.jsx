// src/pages/WatchlistPage.jsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../services/api'
import { SkeletonTable } from '../components/common/Skeleton'

const POPULAR = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock' },
]

const fmt = (n) =>
  n == null
    ? '—'
    : `₹${parseFloat(n).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

export default function WatchlistPage() {

  const qc = useQueryClient()

  const [form, setForm] = useState({
    symbol: '',
    name: '',
    asset_type: 'stock',
  })

  const [showForm, setShowForm] = useState(false)

  const [searchResults, setSearchResults] = useState([])

  // SEARCH STOCKS
  const searchStocks = async (query) => {

    if (!query) {
      setSearchResults([])
      return
    }

    try {

      const res = await api.get(`/stocks/search?q=${query}`)

      setSearchResults(res.data)

    } catch (err) {
      console.log(err)
    }
  }

  // FETCH WATCHLIST
  const { data, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () =>
      api.get('/portfolio/watchlist').then((r) => r.data.data),

    // auto refresh every 10 sec
    refetchInterval: 60000,
  })

  // ADD TO WATCHLIST
  const addMutation = useMutation({
    mutationFn: (body) => api.post('/portfolio/watchlist', body),

    onSuccess: (res) => {

      toast.success(res.data.message)

      qc.invalidateQueries(['watchlist'])

      setShowForm(false)

      setForm({
        symbol: '',
        name: '',
        asset_type: 'stock',
      })

      setSearchResults([])
    },

    onError: (err) => {
      toast.error(
        err.response?.data?.message || 'Failed to add'
      )
    },
  })

  // REMOVE FROM WATCHLIST
  const removeMutation = useMutation({
    mutationFn: (symbol) =>
      api.delete(`/portfolio/watchlist/${symbol}`),

    onSuccess: () => {

      toast.success('Removed from watchlist')

      qc.invalidateQueries(['watchlist'])
    },
  })

  const watchlist = data?.watchlist || []

  return (
    <div className="max-w-4xl space-y-6 page-transition">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Watchlist
          </h2>

          <p className="text-white/40 text-sm mt-1">
            Track assets without holding them
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? '× Close' : '+ Add to Watchlist'}
        </button>

      </div>

      {/* ADD FORM */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5"
        >

          <form
            onSubmit={(e) => {
              e.preventDefault()
              addMutation.mutate(form)
            }}
            className="flex flex-wrap gap-3 items-end"
          >

            {/* SYMBOL */}
            <div className="relative">

              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">
                Symbol
              </label>

              <input
                className="input-dark w-72 font-mono"
                placeholder="Search stocks..."
                value={form.symbol}
                onChange={async (e) => {

                  const value = e.target.value.toUpperCase()

                  setForm({
                    ...form,
                    symbol: value,
                  })

                  await searchStocks(value)

                }}
                required
              />

              {/* SEARCH RESULTS */}
              {searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 bg-[#111] border border-white/10 rounded-lg w-72 max-h-60 overflow-y-auto shadow-xl">

                  {searchResults.map((stock) => (

                    <button
                      type="button"
                      key={stock.symbol}
                      onClick={() => {

                        setForm({
                          ...form,
                          symbol: stock.symbol,
                          name: stock.name || '',
                          asset_type: 'stock',
                        })

                        setSearchResults([])

                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                    >

                      <div className="font-mono text-sm text-white">
                        {stock.symbol}
                      </div>

                      <div className="text-xs text-white/40">
                        {stock.name}
                      </div>

                    </button>

                  ))}

                </div>
              )}

            </div>

            {/* NAME */}
            <div>

              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">
                Name
              </label>

              <input
                className="input-dark w-44"
                placeholder="Apple Inc."
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
              />

            </div>

            {/* TYPE */}
            <div>

              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">
                Type
              </label>

              <select
                className="input-dark w-28"
                value={form.asset_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset_type: e.target.value,
                  })
                }
              >
                <option value="stock">Stock</option>
                <option value="crypto">Crypto</option>
                <option value="etf">ETF</option>
              </select>

            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding...' : 'Add'}
            </button>

          </form>

        </motion.div>
      )}

      {/* TABLE */}
      <div className="glass rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead>
            <tr className="border-b border-white/5">

              {['Asset', 'Type', 'Price', '24h Change', 'Action'].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3.5 text-xs text-white/30 uppercase tracking-wider font-mono"
                >
                  {h}
                </th>
              ))}

            </tr>
          </thead>

          <tbody>

            {isLoading ? (

              <tr>
                <td colSpan={5} className="p-5">
                  <SkeletonTable rows={3} />
                </td>
              </tr>

            ) : watchlist.length === 0 ? (

              <tr>

                <td
                  colSpan={5}
                  className="py-16 text-center text-white/30"
                >

                  <div className="text-3xl mb-2">◉</div>

                  <p>Your watchlist is empty</p>

                  <p className="text-xs mt-1">
                    Add assets to monitor their prices
                  </p>

                </td>

              </tr>

            ) : (

              watchlist.map((item, i) => (

                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                >

                  {/* ASSET */}
                  <td className="px-5 py-3.5">

                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-bold font-mono text-gold">
                        {item.symbol.slice(0, 2)}
                      </div>

                      <div>

                        <p className="font-mono font-semibold text-white">
                          {item.symbol}
                        </p>

                        <p className="text-xs text-white/30">
                          {item.name}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* TYPE */}
                  <td className="px-5 py-3.5">

                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40 font-mono capitalize">
                      {item.asset_type}
                    </span>

                  </td>

                  {/* PRICE */}
                  <td className="px-5 py-3.5 font-mono text-white">
                    {fmt(item.current_price)}
                  </td>

                  {/* CHANGE */}
                  <td
                    className={`px-5 py-3.5 font-mono text-sm ${
                      (item.change_percent || 0) >= 0
                        ? 'text-bull'
                        : 'text-bear'
                    }`}
                  >

                    {(item.change_percent || 0) >= 0 ? '+' : ''}

                    {(item.change_percent || 0).toFixed(2)}%

                  </td>

                  {/* REMOVE */}
                  <td className="px-5 py-3.5">

                    <button
                      onClick={() =>
                        removeMutation.mutate(item.symbol)
                      }
                      className="text-white/20 hover:text-bear text-sm transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>

                  </td>

                </motion.tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* QUICK ADD */}
      <div className="glass rounded-xl p-5">

        <p className="text-sm font-medium text-white/60 mb-3">
          Quick Add
        </p>

        <div className="flex flex-wrap gap-2">

          {POPULAR.filter(
            (p) =>
              !watchlist.some((w) => w.symbol === p.symbol)
          ).map((asset) => (

            <button
              key={asset.symbol}
              onClick={() => addMutation.mutate(asset)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/30 text-sm font-mono text-white/60 hover:text-gold transition-all"
            >

              + {asset.symbol}

            </button>

          ))}

        </div>

      </div>

    </div>
  )
}