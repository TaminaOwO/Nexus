'use client'

import { useState } from 'react'
import type { TokenStatus } from '@/lib/nexus-backend'

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ok:            { label: 'Token 正常', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  expiring_soon: { label: 'Token 即將過期', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  expired:       { label: 'Token 已過期', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  refresh_failed:{ label: 'Token 更新失敗', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
}

interface TokenStatusPanelProps {
  tokenStatus: TokenStatus | null
}

export default function TokenStatusPanel({ tokenStatus: initialStatus }: TokenStatusPanelProps) {
  const [tokenStatus, setTokenStatus] = useState(initialStatus)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!tokenStatus) return null

  const config = STATUS_CONFIG[tokenStatus.status] || STATUS_CONFIG['expired']
  const showForm = tokenStatus.status === 'expired' || tokenStatus.status === 'refresh_failed'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/kite-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: inputValue.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Token 更新失敗')
        return
      }

      // Update status from response
      setTokenStatus(data)
      setInputValue('')
      setErrorMsg('')
    } catch {
      setErrorMsg('網路錯誤，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`px-3 py-2 rounded-sm text-sm font-sans border ${config.bgColor} ${config.color}`}>
      <div className="flex items-center justify-between">
        <span>
          CMoney {config.label}
          {tokenStatus.expires_at && (
            <span className="ml-2 text-xs opacity-70">
              (到期: {new Date(tokenStatus.expires_at).toLocaleString('zh-TW')})
            </span>
          )}
        </span>
        {tokenStatus.last_refreshed && (
          <span className="text-xs opacity-60">
            上次更新: {new Date(tokenStatus.last_refreshed).toLocaleString('zh-TW')}
          </span>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-2 flex gap-2 items-start">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste refresh token"
            disabled={isSubmitting}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-sm bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isSubmitting || !inputValue.trim()}
            className="px-3 py-1 text-sm bg-primary text-white rounded-sm disabled:opacity-50 flex items-center gap-1"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                驗證中...
              </>
            ) : (
              '更新 Token'
            )}
          </button>
        </form>
      )}

      {errorMsg && (
        <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
