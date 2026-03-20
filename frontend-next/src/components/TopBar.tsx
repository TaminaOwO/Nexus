import TerminalChrome from './TerminalChrome'

interface TopBarProps {
  departmentName: string
}

export default function TopBar({ departmentName }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-border">
      <div className="flex items-center gap-6">
        <TerminalChrome />
        <span className="font-display text-lg text-text-primary">
          {departmentName}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-primary text-lg animate-blink">█</span>
        <button className="bg-primary text-white px-4 py-1.5 rounded text-sm font-sans">
          Start Day
        </button>
      </div>
    </div>
  )
}
