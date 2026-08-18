import { KIND_LABELS } from '@/lib/kind-labels'
import { formatIdeaNumber } from '@/lib/ids'
import { kindAccent } from '@/lib/store'
import type { IdeaCard } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface IdeaCardViewProps {
  idea: IdeaCard
  isSelected?: boolean
  isDragging?: boolean
  compact?: boolean
  onClick?: () => void
}

export function IdeaCardView({
  idea,
  isSelected,
  isDragging,
  compact,
  onClick,
}: IdeaCardViewProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${KIND_LABELS[idea.kind]} ${formatIdeaNumber(idea.number)}: ${idea.title}`}
      className={cn(
        'w-full rounded-md border border-stone-700/40 bg-linear-to-br p-3 text-left shadow-[0_10px_24px_-18px_rgba(0,0,0,0.85)] transition duration-200',
        kindAccent(idea.kind),
        compact ? 'min-h-24' : 'min-h-32',
        isSelected && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#120f0c]',
        isDragging && 'opacity-40',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-16px_rgba(0,0,0,0.7)]'
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] tracking-[0.18em] text-stone-700">
          {KIND_LABELS[idea.kind].toUpperCase()} {formatIdeaNumber(idea.number)}
        </span>
        <Badge variant="outline" className="border-stone-500/40 bg-white/40 text-[10px] text-stone-700">
          {idea.status}
        </Badge>
      </div>
      <p className="font-serif text-base leading-snug text-stone-900">{idea.title}</p>
      {!compact && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-700">
          {idea.originalWording}
        </p>
      )}
    </button>
  )
}
