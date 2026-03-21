import { getInboxItems } from '@/lib/fetchers'

export default async function InboxPanel() {
  let items: Awaited<ReturnType<typeof getInboxItems>>

  try {
    items = await getInboxItems()
  } catch {
    items = []
  }

  if (items.length === 0) {
    return (
      <div className="p-4">
        <p className="font-mono text-sm text-text-muted opacity-50">
          No pending items
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-border rounded p-3 mb-2"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block px-1.5 py-0.5 text-xs font-mono rounded-xs bg-primary-subtle text-primary">
              {item.type}
            </span>
            <span className="text-sm text-text-primary font-sans">
              {item.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
