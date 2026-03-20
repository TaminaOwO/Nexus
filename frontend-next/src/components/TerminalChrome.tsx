interface TerminalChromeProps {
  title?: string
}

export default function TerminalChrome({ title }: TerminalChromeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-[#cc7a60]" />
      <span className="w-3 h-3 rounded-full bg-[#C4A060]" />
      <span className="w-3 h-3 rounded-full bg-[#7A9B7E]" />
      {title && (
        <span className="ml-2 font-mono text-xs text-text-muted">{title}</span>
      )}
    </div>
  )
}
