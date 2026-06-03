// src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import api from '../services/api'
import useAuthStore from '../context/authStore'

const STARTER_PROMPTS = [
  'What should I know about my current portfolio risk?',
  'Explain what a P/E ratio means for stocks',
  'What is the difference between stocks and ETFs?',
  'How do I interpret bullish vs bearish sentiment?',
  'What is dollar-cost averaging?',
]

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${
        isUser ? 'bg-white/10 text-white/60' : 'bg-accent/20 text-accent border border-accent/30'
      }`}>
        {isUser ? 'U' : '✦'}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-white/8 text-white/90 rounded-tr-sm'
            : 'bg-surface-600 border border-white/6 text-white/85 rounded-tl-sm'
        }`}>
          {msg.message}
        </div>
        <span className="text-xs text-white/20 px-1">
          {msg.created_at
            ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })
            : 'just now'}
        </span>
      </div>
    </motion.div>
  )
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    const userMsg = { role: 'user', message: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const { data } = await api.post('/ai/chat', { message: msg, session_id: sessionId })
      setSessionId(data.data.session_id)
      setMessages(prev => [...prev, { role: 'assistant', message: data.data.message }])
    } catch (err) {
      toast.error('AI is unavailable right now')
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: 'Sorry, I\'m having trouble connecting. Please check your Gemini API key configuration.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionId(null)
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col page-transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <span className="text-accent">✦</span> AI Finance Advisor
          </h2>
          <p className="text-white/40 text-xs mt-0.5">Powered by Google Gemini</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn-ghost text-xs border border-white/10 px-3 py-1.5">
            New Chat
          </button>
        )}
      </div>

      {/* Chat window */}
      <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                className="mb-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl mb-4 mx-auto">
                  ✦
                </div>
                <h3 className="font-display font-semibold text-white text-lg mb-1">FinPulse AI Advisor</h3>
                <p className="text-white/40 text-sm max-w-sm">
                  Ask me anything about finance, your portfolio, market trends, or investment concepts.
                </p>
                <p className="text-white/20 text-xs mt-2">
                  ⚠ Not financial advice — always do your own research
                </p>
              </motion.div>

              {/* Starter prompts */}
              <div className="space-y-2 w-full max-w-md">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-white/4 hover:bg-white/8 border border-white/8 hover:border-accent/20 text-sm text-white/60 hover:text-white/90 transition-all"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs">✦</div>
                  <div className="bg-surface-600 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-3">
            <textarea
              className="input-dark flex-1 resize-none min-h-[44px] max-h-32 py-2.5"
              placeholder="Ask about stocks, crypto, portfolio strategies..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary px-4 flex-shrink-0 disabled:opacity-40"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : '→'}
            </button>
          </div>
          <p className="text-xs text-white/20 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
