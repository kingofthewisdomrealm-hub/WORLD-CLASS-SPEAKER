'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IdeaCardView } from '@/components/game/idea-card-view'
import { ROLE_FAMILIES, SPEECH_ROLE_LABELS } from '@/lib/speech-structure'
import { useSpeakerStore } from '@/lib/store'
import type { SpeechComponentRole, SuggestedRole } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ClassifyBoard({ projectId }: { projectId: string }) {
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )
  const classifyIdea = useSpeakerStore((state) => state.classifyIdea)
  const classifyIdeas = useSpeakerStore((state) => state.classifyIdeas)
  const setStage = useSpeakerStore((state) => state.setStage)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)

  if (!project) return null

  const classifiedCount = project.ideas.filter((idea) => idea.role && idea.role !== 'unsorted').length

  async function handleSuggest() {
    if (!project) return
    setIsSuggesting(true)
    try {
      const response = await fetch('/api/classify-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideas: project.ideas }),
      })
      const payload = (await response.json()) as { roles: SuggestedRole[] }
      const assignments = (payload.roles ?? []).filter((item) => item.role !== 'unsorted')
      classifyIdeas(projectId, assignments)
      toast.success(
        assignments.length
          ? `${assignments.length} cards labeled as speech components`
          : 'No strong placements yet — sort a few by hand'
      )
    } finally {
      setIsSuggesting(false)
    }
  }

  function handleClassify(ideaId: string, role: SpeechComponentRole) {
    classifyIdea(projectId, ideaId, role)
    toast.success(
      role === 'unsorted'
        ? 'Returned to unsorted'
        : `+10 XP · ${SPEECH_ROLE_LABELS[role]}`
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
            LEVEL 1 · CLASSIFY
          </p>
          <h1 className="font-serif text-4xl text-amber-50">Turn the dump into speech cards.</h1>
          <p className="mt-2 max-w-2xl text-amber-100/60">
            Each card is a possible component of a talk. You are labeling the Lego, not choosing the Big Idea.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSuggest()}
            disabled={isSuggesting || project.ideas.length === 0}
            className="border-amber-200/20 text-amber-100"
          >
            <Sparkles />
            {isSuggesting ? 'Labeling…' : 'Ask AI for jobs'}
          </Button>
          <Button asChild onClick={() => setStage(projectId, 'organize')}>
            <Link href={`/play/${projectId}/organize`}>
              Organize {classifiedCount} cards
            </Link>
          </Button>
        </div>
      </header>

      <p className="font-mono text-xs tracking-[0.18em] text-amber-200/50">
        {classifiedCount} / {project.ideas.length} CLASSIFIED
      </p>

      <div className="grid gap-4">
        {project.ideas.map((idea) => {
          const isActive = activeId === idea.id
          return (
            <article
              key={idea.id}
              className={cn(
                'grid gap-4 rounded-2xl border border-amber-200/10 bg-black/20 p-4 lg:grid-cols-[minmax(0,280px)_1fr]',
                isActive && 'border-amber-300/40'
              )}
            >
              <IdeaCardView
                idea={idea}
                compact
                isSelected={isActive}
                onClick={() => setActiveId(idea.id)}
              />
              <div className="space-y-3">
                <p className="font-mono text-[10px] tracking-[0.2em] text-amber-300/60">
                  THIS CARD COULD SERVE AS
                </p>
                {ROLE_FAMILIES.map((family) => (
                  <div key={family.label}>
                    <p className="mb-2 text-xs text-amber-100/45">{family.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {family.roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleClassify(idea.id, role)}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs tracking-wide',
                            idea.role === role
                              ? 'border-amber-300 bg-amber-300 text-stone-900'
                              : 'border-amber-200/20 text-amber-100/80 hover:border-amber-200/50'
                          )}
                        >
                          {SPEECH_ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleClassify(idea.id, 'unsorted')}
                  className="text-xs text-amber-200/40 hover:text-amber-100"
                >
                  Keep unsorted
                </button>
              </div>
            </article>
          )
        })}
      </div>
      {project.ideas.length === 0 && (
        <p className="rounded-2xl border border-dashed border-amber-200/15 p-8 text-amber-100/50">
          Capture ideas in the interview first.
        </p>
      )}
    </div>
  )
}
