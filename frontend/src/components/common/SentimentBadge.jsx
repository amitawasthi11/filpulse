// src/components/common/SentimentBadge.jsx
export default function SentimentBadge({ sentiment, size = 'sm' }) {
  if (!sentiment) return null

  const map = {
    Bullish: { cls: 'badge-bullish', icon: '▲', label: 'Bullish' },
    Bearish: { cls: 'badge-bearish', icon: '▼', label: 'Bearish' },
    Neutral: { cls: 'badge-neutral', icon: '◆', label: 'Neutral' },
  }

  const info = map[sentiment] || map.Neutral

  return (
    <span className={info.cls} style={size === 'md' ? { fontSize: '13px', padding: '4px 10px' } : {}}>
      <span>{info.icon}</span>
      {info.label}
    </span>
  )
}
