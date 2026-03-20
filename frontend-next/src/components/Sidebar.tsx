'use client'

import { useState } from 'react'

interface NavNode {
  label: string
  icon: string
  enabled: boolean
  children?: NavNode[]
}

const NAV_TREE: NavNode[] = [
  {
    label: 'Orchestrator',
    icon: '>',
    enabled: true,
    children: [
      { label: 'Dev', icon: '$', enabled: true },
      { label: 'Life', icon: '$', enabled: true },
      { label: 'Finance', icon: '$', enabled: false },
      { label: 'Marketing', icon: '$', enabled: false },
      { label: 'Business', icon: '$', enabled: false },
    ],
  },
]

export default function Sidebar() {
  const [active, setActive] = useState('Dev')

  return (
    <aside className="w-[240px] min-w-[240px] bg-surface border-r border-border flex flex-col">
      <div className="px-6 py-6">
        <h1 className="font-display text-2xl text-primary">NEXUS</h1>
      </div>

      <nav className="flex-1 px-3">
        {NAV_TREE.map((node) => (
          <div key={node.label}>
            <button
              onClick={() => node.enabled && setActive(node.label)}
              className={`w-full text-left px-3 py-2 text-sm font-sans flex items-center gap-2 rounded-sm ${
                active === node.label
                  ? 'border-l-[3px] border-primary bg-[rgba(204,122,96,0.08)]'
                  : 'border-l-[3px] border-transparent'
              } ${node.enabled ? 'text-text-primary' : 'text-text-muted opacity-40 cursor-default'}`}
            >
              <span className="font-mono text-xs text-secondary">{node.icon}</span>
              {node.label}
            </button>

            {node.children && (
              <div className="ml-4">
                {node.children.map((child) => (
                  <button
                    key={child.label}
                    onClick={() => child.enabled && setActive(child.label)}
                    className={`w-full text-left px-3 py-1.5 text-sm font-sans flex items-center gap-2 rounded-sm ${
                      active === child.label
                        ? 'border-l-[3px] border-primary bg-[rgba(204,122,96,0.08)]'
                        : 'border-l-[3px] border-transparent'
                    } ${child.enabled ? 'text-text-primary cursor-pointer' : 'text-text-muted opacity-40 cursor-default'}`}
                  >
                    <span className="font-mono text-xs text-text-muted">{child.icon}</span>
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
