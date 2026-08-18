'use client'

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Sparkles, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IdeaCardView } from '@/components/game/idea-card-view'
import { formatIdeaNumber } from '@/lib/ids'
import { useSpeakerStore } from '@/lib/store'
import type { IdeaCard, SuggestedCluster } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MatchingBoardProps {
  projectId: string
}

function DraggableIdea({
  idea,
  isSelected,
  onToggle,
}: {
  idea: IdeaCard
  isSelected: boolean
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: idea.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn('touch-none', isDragging && 'z-50')}
      {...listeners}
      {...attributes}
    >
      <IdeaCardView
        idea={idea}
        compact
        isSelected={isSelected}
        isDragging={isDragging}
        onClick={onToggle}
      />
    </div>
  )
}

function DropZone({
  id,
  title,
  children,
  className,
}: {
  id: string
  title: string
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <section
      ref={setNodeRef}
      className={cn(
        'min-h-48 rounded-2xl border border-amber-200/10 bg-black/20 p-3 transition',
        isOver && 'border-amber-300/50 bg-amber-300/5',
        className
      )}
    >
      <p className="mb-3 font-mono text-[10px] tracking-[0.22em] text-amber-300/70">
        {title}
      </p>
      {children}
    </section>
  )
}

export function MatchingBoard({ projectId }: MatchingBoardProps) {
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )
  const createCluster = useSpeakerStore((state) => state.createCluster)
  const moveIdeaToCluster = useSpeakerStore((state) => state.moveIdeaToCluster)
  const nameCluster = useSpeakerStore((state) => state.nameCluster)
  const splitCluster = useSpeakerStore((state) => state.splitCluster)
  const applySuggestedCluster = useSpeakerStore((state) => state.applySuggestedCluster)
  const markIdeaStatus = useSpeakerStore((state) => state.markIdeaStatus)
  const setStage = useSpeakerStore((state) => state.setStage)
  const [selected, setSelected] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<SuggestedCluster[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  if (!project) return null

  const pool = project.ideas.filter((idea) => !idea.clusterId)

  function handleDragEnd(event: DragEndEvent) {
    const ideaId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null
    if (!overId) return
    if (overId === 'new-cluster') {
      createCluster(projectId, [ideaId])
      toast.success('+25 XP · Cluster created')
      return
    }
    if (overId === 'pool') {
      moveIdeaToCluster(projectId, ideaId, null)
      return
    }
    moveIdeaToCluster(projectId, ideaId, overId)
  }

  function handleGroupSelected() {
    if (selected.length < 2) return
    createCluster(projectId, selected)
    if (selected.length >= 3) toast.success('+30 XP · Matched related ideas')
    else toast.success('+25 XP · Cluster created')
    setSelected([])
  }

  async function handleSuggest() {
    if (!project) return
    setIsSuggesting(true)
    try {
      const response = await fetch('/api/suggest-clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideas: project.ideas }),
      })
      const payload = (await response.json()) as { clusters: SuggestedCluster[] }
      setSuggestions(payload.clusters ?? [])
    } finally {
      setIsSuggesting(false)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
              HUMAN MATCHING MINI-GAME
            </p>
            <h1 className="font-serif text-3xl text-amber-50">Build your map</h1>
            <p className="mt-1 max-w-xl text-sm text-amber-100/60">
              Drag related cards together. The AI can notice connections. It does not decide what your speech is about.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="border-amber-200/20 text-amber-100"
            >
              <Sparkles />
              {isSuggesting ? 'Looking…' : 'Ask AI for connections'}
            </Button>
            <Button
              type="button"
              onClick={handleGroupSelected}
              disabled={selected.length < 2}
            >
              Group selected ({selected.length})
            </Button>
            <Button asChild onClick={() => setStage(projectId, 'themes')}>
              <Link href={`/play/${projectId}/themes`}>Reveal themes</Link>
            </Button>
          </div>
        </header>

        {suggestions.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
            <p className="font-mono text-[11px] tracking-[0.2em] text-amber-200">
              HERE IS A CONNECTION I SEE
            </p>
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.ideaNumbers.join('-')}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/10 bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="text-amber-50">
                    Ideas {suggestion.ideaNumbers.map((n) => formatIdeaNumber(n)).join(', ')} may belong together.
                  </p>
                  <p className="text-sm text-amber-100/60">{suggestion.reason}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    applySuggestedCluster(projectId, suggestion)
                    toast.success(`Cluster suggested: ${suggestion.proposedName}`)
                  }}
                  className="border-amber-200/20 text-amber-100"
                >
                  See them
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <DropZone id="pool" title="UNGROUPED CARDS" className="min-h-64">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pool.map((idea) => (
                <div key={idea.id} className="space-y-2">
                  <DraggableIdea
                    idea={idea}
                    isSelected={selected.includes(idea.id)}
                    onToggle={() =>
                      setSelected((current) =>
                        current.includes(idea.id)
                          ? current.filter((id) => id !== idea.id)
                          : [...current, idea.id]
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-[11px] tracking-wide text-amber-200/50 hover:text-amber-100"
                    onClick={() => markIdeaStatus(projectId, idea.id, 'unrelated')}
                  >
                    Interesting but unrelated
                  </button>
                </div>
              ))}
              {pool.length === 0 && (
                <p className="text-sm text-amber-100/50">All cards are in clusters.</p>
              )}
            </div>
          </DropZone>
          <DropZone id="new-cluster" title="DROP TO CREATE CLUSTER" className="flex items-center justify-center">
            <p className="text-center font-serif text-xl text-amber-100/70">
              New cluster
            </p>
          </DropZone>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {project.clusters.map((cluster) => (
            <DropZone key={cluster.id} id={cluster.id} title={cluster.isNamed ? 'NAMED CLUSTER' : 'UNNAMED CLUSTER'}>
              <div className="mb-3 flex items-center gap-2">
                <Input
                  value={cluster.name}
                  aria-label="Cluster name"
                  onChange={(event) => nameCluster(projectId, cluster.id, event.target.value)}
                  onBlur={(event) => nameCluster(projectId, cluster.id, event.target.value, true)}
                  className="border-amber-200/15 bg-black/30 font-serif text-lg text-amber-50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Split cluster"
                  onClick={() => splitCluster(projectId, cluster.id)}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="grid gap-3">
                {cluster.ideaIds
                  .map((id) => project.ideas.find((idea) => idea.id === id))
                  .filter((idea): idea is IdeaCard => Boolean(idea))
                  .map((idea) => (
                    <DraggableIdea
                      key={idea.id}
                      idea={idea}
                      isSelected={selected.includes(idea.id)}
                      onToggle={() =>
                        setSelected((current) =>
                          current.includes(idea.id)
                            ? current.filter((id) => id !== idea.id)
                            : [...current, idea.id]
                        )
                      }
                    />
                  ))}
              </div>
            </DropZone>
          ))}
        </div>
      </div>
    </DndContext>
  )
}
