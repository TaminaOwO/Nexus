import type { InboxItem } from '@/lib/types'

interface QAWarningBlockProps {
  items: InboxItem[]
}

export default function QAWarningBlock({ items }: QAWarningBlockProps) {
  const failItems = items.filter(
    i => i.name.includes('QA_FAIL') || i.name.includes('FAIL')
  )

  if (failItems.length === 0) return null

  return (
    <div className="border-l-4 border-[#FF5F56] bg-[#FF5F56]/5 p-3 mb-3 rounded-r">
      {failItems.map(item => (
        <div key={item.id} className="font-mono text-sm mb-1 last:mb-0">
          <p className="text-[#FF5F56]">&gt; QA FAIL: {item.name}</p>
          <p className="text-text-secondary">$ action required</p>
        </div>
      ))}
    </div>
  )
}
