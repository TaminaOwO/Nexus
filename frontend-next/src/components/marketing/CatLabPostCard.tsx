import type { CatLabPost } from '@/lib/catlab-types'

interface CatLabPostCardProps {
  post: CatLabPost
}

const PERSONA_LABELS: Record<CatLabPost['persona'], string> = {
  observer: '觀察員',
  researcher: '研究員',
  unknown: 'Unknown',
}

const PERSONA_COLORS: Record<CatLabPost['persona'], string> = {
  observer: 'bg-secondary-subtle text-secondary',
  researcher: 'bg-primary-subtle text-primary',
  unknown: 'bg-surface-raised text-text-muted',
}

export default function CatLabPostCard({ post }: CatLabPostCardProps) {
  return (
    <div className="bg-white border border-border rounded-md p-4 space-y-3">
      {/* Header: title + status */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-base text-text-primary leading-snug">
          {post.title}
        </h4>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-sm text-xs font-sans ${
            post.status === 'published'
              ? 'bg-success-subtle text-success'
              : 'bg-warning-subtle text-warning'
          }`}
        >
          {post.status === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Persona badge + date */}
      <div className="flex items-center gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded-sm font-sans ${PERSONA_COLORS[post.persona]}`}>
          {PERSONA_LABELS[post.persona]}
        </span>
        {post.date && (
          <span className="text-text-muted font-mono">{post.date}</span>
        )}
      </div>

      {/* Excerpt */}
      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
        {post.excerpt}
      </p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-surface-raised text-text-muted text-xs rounded-sm font-mono"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
