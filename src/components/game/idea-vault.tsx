'use client'

import Link from 'next/link'
import { useSpeakerStore } from '@/lib/store'
import { IdeaCardView } from '@/components/game/idea-card-view'
import { Button } from '@/components/ui/button'
import { KIND_LABELS } from '@/lib/kind-labels'

export function IdeaVault({ projectId }: { projectId: string }) {
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )
  const setStage = useSpeakerStore((state) => state.setStage)

  if (!project) return null

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
            IDEA VAULT
          </p>
          <h1 className="font-serif text-4xl text-amber-50">
            You discovered {project.ideas.length} idea{project.ideas.length === 1 ? '' : 's'}.
          </h1>
          <p className="mt-2 max-w-2xl text-amber-100/60">
            Nothing was discarded. Next you will classify these into the components of a speech.
          </p>
        </div>
        <Button asChild onClick={() => setStage(projectId, 'classify')}>
          <Link href={`/play/${projectId}/classify`}>Classify into speech cards</Link>
        </Button>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {project.ideas.map((idea) => (
          <div key={idea.id} className="space-y-2">
            <IdeaCardView idea={idea} />
            <p className="px-1 font-mono text-[10px] tracking-[0.16em] text-amber-200/40">
              {KIND_LABELS[idea.kind].toUpperCase()} · {new Date(idea.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      {project.ideas.length === 0 && (
        <p className="rounded-2xl border border-dashed border-amber-200/15 p-8 text-amber-100/50">
          The vault is empty. Return to the interview and talk.
        </p>
      )}
    </div>
  )
}
