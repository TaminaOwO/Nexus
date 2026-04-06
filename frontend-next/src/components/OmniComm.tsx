"use client"

import { useEffect, useState, useCallback, useRef } from "react"

interface ToastState {
  message: string
  type: "success" | "error"
}

export default function OmniComm() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return

    // Parse hashtag from input: "#req some content" → hashtag="#req", content="some content"
    const match = input.match(/^(#\w+)\s+([\s\S]+)$/)
    if (!match) {
      setToast({ message: "格式錯誤：請使用 #hashtag 內容", type: "error" })
      return
    }

    const [, hashtag, content] = match
    setIsLoading(true)

    try {
      const res = await fetch("/api/omni-comm/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashtag, content }),
      })

      const data = await res.json()

      if (!res.ok) {
        setToast({ message: data.error || "未知錯誤", type: "error" })
        return
      }

      setToast({
        message: `已送出至遠端，請在本地執行 git pull 同步 (${data.path})`,
        type: "success",
      })
      setInput("")
      setIsOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "網路錯誤"
      setToast({ message: msg, type: "error" })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading])

  return (
    <>
      {/* Command Palette Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-lg bg-surface-primary border border-border-primary rounded-lg shadow-2xl p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
                }}
                placeholder="輸入指令 (例: #req 需求描述)"
                className="flex-1 bg-surface-secondary text-text-primary border border-border-primary rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary"
                disabled={isLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-accent-primary text-white rounded text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50"
              >
                {isLoading ? "送出中..." : "送出"}
              </button>
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              Cmd+K 開關 | #req #prop #note | Esc 關閉
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg text-sm ${
            toast.type === "success"
              ? "bg-green-900/90 text-green-100 border border-green-700"
              : "bg-red-900/90 text-red-100 border border-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  )
}
