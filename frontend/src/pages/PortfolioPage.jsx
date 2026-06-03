// src/pages/PortfolioPage.jsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../services/api'
import { SkeletonTable } from '../components/common/Skeleton'

const POPULAR_ASSETS = [
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', type: 'stock' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', type: 'stock' },
  { symbol: 'INFY.NS', name: 'Infosys', type: 'stock' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
]

const fmt = (n) =>
  n == null
    ? '—'
    : `₹${parseFloat(n).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

export default function PortfolioPage() {

  const qc = useQueryClient()

  const [showAddModal, setShowAddModal] =
    useState(false)

  const [search, setSearch] =
    useState('')

  const [searchResults, setSearchResults] =
    useState([])

  const [form, setForm] = useState({
    symbol: '',
    name: '',
    asset_type: 'stock',
    quantity: '',
    purchase_price: '',
    purchase_date: '',
  })

  // ============================================
  // SEARCH STOCKS
  // ============================================

  const searchStocks = async (query) => {

    if (!query) {

      setSearchResults([])

      return
    }

    try {

      const res =
        await api.get(
          `/stocks/search?q=${query}`
        )

      setSearchResults(res.data)

    } catch (err) {

      console.log(err)

    }
  }

  // ============================================
  // FETCH PORTFOLIO
  // ============================================

  const { data, isLoading } = useQuery({

    queryKey: ['portfolio'],

    queryFn: () =>
      api.get('/portfolio')
        .then(r => r.data.data),

    refetchInterval: 10000,

  })

  // ============================================
  // ADD ASSET
  // ============================================

  const addMutation = useMutation({

    mutationFn: (body) =>
      api.post('/portfolio', body),

    onSuccess: (res) => {

      toast.success(res.data.message)

      qc.invalidateQueries(['portfolio'])

      setShowAddModal(false)

      setForm({
        symbol: '',
        name: '',
        asset_type: 'stock',
        quantity: '',
        purchase_price: '',
        purchase_date: '',
      })

      setSearchResults([])

    },

    onError: (err) => {

      toast.error(
        err.response?.data?.message ||
        'Failed to add asset'
      )

    },

  })

  // ============================================
  // DELETE ASSET
  // ============================================

  const deleteMutation = useMutation({

    mutationFn: (id) =>
      api.delete(`/portfolio/${id}`),

    onSuccess: (res) => {

      toast.success(res.data.message)

      qc.invalidateQueries(['portfolio'])

    },

    onError: () =>
      toast.error('Failed to remove asset'),

  })

  // ============================================

  const assets =
    data?.assets || []

  const summary =
    data?.summary || {}

  const filtered = assets.filter((a) =>
    a.symbol
      .toUpperCase()
      .includes(search.toUpperCase()) ||

    a.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  )

  // ============================================

  const handleQuickAdd = (asset) => {

    setForm({

      ...form,

      symbol: asset.symbol,

      name: asset.name,

      asset_type: asset.type,

    })

    setShowAddModal(true)
  }

  // ============================================

  const handleSubmit = (e) => {

    e.preventDefault()

    if (
      !form.symbol ||
      !form.quantity ||
      !form.purchase_price
    ) {

      return toast.error(
        'Fill all required fields'
      )
    }

    addMutation.mutate(form)
  }

  // ============================================

  return (

    <div className="max-w-6xl space-y-6 page-transition">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h2 className="font-display text-2xl font-bold text-white">
            Portfolio
          </h2>

          <p className="text-white/40 text-sm mt-1">
            Manage your holdings
          </p>

        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          + Add Asset
        </button>

      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {[
          {
            label: 'Total Value',
            val: `₹ ${Number(summary.total_value || 0).toLocaleString()}`,
            color: 'text-white',
          },

          {
            label: 'Invested',
            val: `₹ ${Number(summary.total_cost || 0).toLocaleString()}`,
            color: 'text-white',
          },

          {
            label: 'P&L',
            val:
              `${summary.total_pnl >= 0 ? '+' : ''}${fmt(summary.total_pnl)}`,
            color:
              summary.total_pnl >= 0
                ? 'text-bull'
                : 'text-bear',
          },

          {
            label: 'Return',
            val:
              `${summary.total_pnl_percent >= 0 ? '+' : ''}${(summary.total_pnl_percent || 0).toFixed(2)}%`,
            color:
              summary.total_pnl_percent >= 0
                ? 'text-bull'
                : 'text-bear',
          },

        ].map(({ label, val, color }) => (

          <div
            key={label}
            className="glass rounded-xl p-4"
          >

            <p className="text-xs text-white/40 uppercase tracking-widest font-mono">
              {label}
            </p>

            <p className={`text-xl font-display font-bold ${color} mt-1`}>
              {val}
            </p>

          </div>

        ))}

      </div>

      {/* SEARCH */}
      <div className="flex gap-3">

        <input
          className="input-dark max-w-xs"
          placeholder="Search portfolio..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* TABLE */}
      <div className="glass rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead>

            <tr className="border-b border-white/5">

              {[
                'Asset',
                'Type',
                'Qty',
                'Avg Price',
                'Current',
                'Value',
                'P&L',
                'Change',
                '',
              ].map((h) => (

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

                <td colSpan={9} className="p-5">
                  <SkeletonTable rows={4} />
                </td>

              </tr>

            ) : filtered.length === 0 ? (

              <tr>

                <td
                  colSpan={9}
                  className="py-16 text-center text-white/30"
                >

                  <div className="text-3xl mb-2">
                    ◈
                  </div>

                  <p>
                    {search
                      ? 'No matching assets'
                      : 'Portfolio is empty'}
                  </p>

                </td>

              </tr>

            ) : (

              filtered.map((asset, i) => (

                <motion.tr
                  key={asset.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                >

                  {/* ASSET */}
                  <td className="px-5 py-3.5">

                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold font-mono text-accent">
                        {asset.symbol.slice(0, 2)}
                      </div>

                      <div>

                        <p className="font-mono font-semibold text-white">
                          {asset.symbol}
                        </p>

                        <p className="text-xs text-white/30">
                          {asset.name}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* TYPE */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40 font-mono capitalize">
                      {asset.asset_type}
                    </span>
                  </td>

                  {/* QTY */}
                  <td className="px-5 py-3.5 font-mono text-white/70">
                    {parseFloat(asset.quantity)}
                  </td>

                  {/* AVG */}
                  <td className="px-5 py-3.5 font-mono text-white/70">
                    {fmt(asset.purchase_price)}
                  </td>

                  {/* CURRENT */}
                  <td className="px-5 py-3.5 font-mono text-white">
                    {fmt(asset.current_price)}
                  </td>

                  {/* VALUE */}
                  <td className="px-5 py-3.5 font-mono text-white">
                    {fmt(asset.current_value)}
                  </td>

                  {/* PNL */}
                  <td className={`px-5 py-3.5 font-mono ${
                    asset.pnl >= 0
                      ? 'text-bull'
                      : 'text-bear'
                  }`}>
                    {asset.pnl >= 0 ? '+' : ''}
                    {fmt(asset.pnl)}
                  </td>

                  {/* CHANGE */}
                  <td className={`px-5 py-3.5 font-mono text-xs ${
                    (asset.change_percent || 0) >= 0
                      ? 'text-bull'
                      : 'text-bear'
                  }`}>
                    {(asset.change_percent || 0) >= 0 ? '+' : ''}
                    {Number(asset.change_percent || 0).toFixed(2)}%
                  </td>

                  {/* DELETE */}
                  <td className="px-5 py-3.5">

                    <button
                      onClick={() => {

                        if (
                          confirm(
                            `Remove ${asset.symbol}?`
                          )
                        ) {

                          deleteMutation.mutate(
                            asset.id
                          )

                        }

                      }}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-bear transition-all text-lg"
                    >
                      ×
                    </button>

                  </td>

                </motion.tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* QUICK ADD */}
      <div className="glass rounded-xl p-6">

        <h3 className="font-display font-semibold text-white mb-4">
          Popular Assets
        </h3>

        <div className="flex flex-wrap gap-2">

          {POPULAR_ASSETS.map((asset) => (

            <button
              key={asset.symbol}
              onClick={() =>
                handleQuickAdd(asset)
              }
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-accent/10 border border-white/10 hover:border-accent/30 text-sm font-mono text-white/70 hover:text-accent transition-all"
            >
              {asset.symbol}
            </button>

          ))}

        </div>

      </div>

      {/* ADD MODAL */}
      <AnimatePresence>

        {showAddModal && (

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >

            <motion.div
              initial={{
                scale: 0.95,
                y: 20,
              }}

              animate={{
                scale: 1,
                y: 0,
              }}

              exit={{
                scale: 0.95,
                y: 20,
              }}

              className="glass rounded-2xl p-7 w-full max-w-md"
            >

              <div className="flex items-center justify-between mb-6">

                <h3 className="font-display font-bold text-white text-xl">
                  Add Asset
                </h3>

                <button
                  onClick={() =>
                    setShowAddModal(false)
                  }
                  className="text-white/30 hover:text-white text-xl"
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* SYMBOL SEARCH */}
                <div className="relative">

                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">
                    Symbol *
                  </label>

                  <input
                    className="input-dark font-mono"
                    placeholder="Search stock..."
                    value={form.symbol}

                    onChange={async (e) => {

                      const value =
                        e.target.value.toUpperCase()

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

                    <div className="absolute z-50 mt-1 bg-[#111] border border-white/10 rounded-lg w-full max-h-60 overflow-y-auto shadow-xl">

                      {searchResults.map((stock) => (

                        <button
                          type="button"

                          key={stock.symbol}

                          onClick={() => {

                            setForm({

                              ...form,

                              symbol:
                                stock.symbol,

                              name:
                                stock.name || '',

                              asset_type:
                                stock.type === 'CRYPTOCURRENCY'
                                  ? 'crypto'
                                  : 'stock',

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
                    Company Name *
                  </label>

                  <input
                    className="input-dark"
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
                    className="input-dark"

                    value={form.asset_type}

                    onChange={(e) =>
                      setForm({
                        ...form,
                        asset_type:
                          e.target.value,
                      })
                    }
                  >

                    <option value="stock">
                      Stock
                    </option>

                    <option value="crypto">
                      Crypto
                    </option>

                    <option value="etf">
                      ETF
                    </option>

                  </select>

                </div>

                {/* QTY */}
                <div>

                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">
                    Quantity *
                  </label>

                  <input
                    className="input-dark font-mono"

                    type="number"

                    step="any"

                    min="0.00000001"

                    value={form.quantity}

                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantity:
                          e.target.value,
                      })
                    }

                    required
                  />

                </div>

                {/* PURCHASE PRICE */}
                <div>

                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">
                    Buy Price *
                  </label>

                  <input
                    className="input-dark font-mono"

                    type="number"

                    step="any"

                    min="0"

                    value={form.purchase_price}

                    onChange={(e) =>
                      setForm({
                        ...form,
                        purchase_price:
                          e.target.value,
                      })
                    }

                    required
                  />

                </div>

                {/* DATE */}
                <div>

                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">
                    Purchase Date
                  </label>

                  <input
                    className="input-dark"

                    type="date"

                    value={form.purchase_date}

                    onChange={(e) =>
                      setForm({
                        ...form,
                        purchase_date:
                          e.target.value,
                      })
                    }
                  />

                </div>

                {/* BUTTONS */}
                <div className="flex gap-3 pt-2">

                  <button
                    type="button"

                    onClick={() =>
                      setShowAddModal(false)
                    }

                    className="btn-ghost flex-1 border border-white/10"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"

                    disabled={addMutation.isPending}

                    className="btn-primary flex-1 disabled:opacity-50"
                  >

                    {addMutation.isPending
                      ? 'Adding...'
                      : 'Add Asset'}

                  </button>

                </div>

              </form>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  )
}