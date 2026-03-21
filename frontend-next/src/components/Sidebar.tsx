'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavNode {
  label: string
  icon: string
  enabled: boolean
  href?: string
  children?: NavNode[]
}

const NAV_TREE: NavNode[] = [
  {
    label: 'Orchestrator',
    icon: '>',
    enabled: true,
    children: [
      { label: 'Dev', icon: '$', enabled: true, href: '/dev' },
      { label: 'Life', icon: '$', enabled: true, href: '/life' },
      { label: 'Finance', icon: '$', enabled: false },
      { label: 'Marketing', icon: '$', enabled: false },
      { label: 'Business', icon: '$', enabled: false },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[240px] min-w-[240px] bg-surface border-r border-border flex flex-col">
      <div className="px-6 py-6">
        <h1 className="font-display text-2xl text-primary">NEXUS</h1>
      </div>

      <nav className="flex-1 px-3">
        {NAV_TREE.map((node) => (
          <div key={node.label}>
            <button
              className={`w-full text-left px-3 py-2 text-sm font-sans flex items-center gap-2 rounded-sm ${
                pathname === (node.href ?? '')
                  ? 'border-l-[3px] border-primary bg-[rgba(204,122,96,0.08)]'
                  : 'border-l-[3px] border-transparent'
              } ${node.enabled ? 'text-text-primary' : 'text-text-muted opacity-40 cursor-default'}`}
            >
              <span className="font-mono text-xs text-secondary">{node.icon}</span>
              {node.label}
            </button>

            {node.children && (
              <div className="ml-4">
                {node.children.map((child) => {
                  const isActive = child.href ? pathname === child.href : false
                  const baseClass = `w-full text-left px-3 py-1.5 text-sm font-sans flex items-center gap-2 rounded-sm ${
                    isActive
                      ? 'border-l-[3px] border-primary bg-[rgba(204,122,96,0.08)]'
                      : 'border-l-[3px] border-transparent'
                  } ${child.enabled ? 'text-text-primary cursor-pointer' : 'text-text-muted opacity-40 cursor-default'}`

                  const inner = (
                    <>
                      <span className="font-mono text-xs text-text-muted">{child.icon}</span>
                      {child.label}
                    </>
                  )

                  if (child.enabled && child.href) {
                    return (
                      <Link key={child.label} href={child.href} className={baseClass}>
                        {inner}
                      </Link>
                    )
                  }

                  return (
                    <button key={child.label} className={baseClass}>
                      {inner}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
