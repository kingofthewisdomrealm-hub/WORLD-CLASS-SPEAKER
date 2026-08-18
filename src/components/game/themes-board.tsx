'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSpeakerStore } from '@/lib/store'

export function ThemesBoard({ projectId }: { projectId: string }) {
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )
  const promoteClustersToThemes = useSpeakerStore((state) => state.promoteClustersToThemes)
  const renameTheme = useSpeakerStore((state) => state.renameTheme)
  const setStage = useSpeakerStore((state) => state.setStage)

  useEffect(() => {
    promoteClustersToThemes(projectId)
  }, [projectId, promoteClustersToThemes])

  if (!project) return null

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
            EMERGING THEMES
          </p>
          <h1 className="font-serif text-4xl text-amber-50">Patterns, not a verdict.</h1>
          <p className="mt-2 max-w-2xl text-amber-100/60">
            Investigate each theme. The big idea comes later, from this material — not from an AI thesis.
          </p>
        </div>
        <Button asChild onClick={() => setStage(projectId, 'scoreboard')}>
          <Link href={`/play/${projectId}/scoreboard`}>Open scoreboard</Link>
        </Button>
      </header>
      {project.themes.length === 0 && (
        <p className="rounded-2xl border border-dashed border-amber-200/15 p-8 text-amber-100/50">
          Name at least one cluster in the matching game to reveal a theme.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {project.themes.map((theme, index) => (
          <article
            key={theme.id}
            className="rounded-2xl border border-amber-200/10 bg-black/25 p-5"
          >
            <p className="font-mono text-[11px] tracking-[0.22em] text-amber-300/70">
              THEME {letters[index] ?? index + 1}
            </p>
            <Input
              value={theme.name}
              aria-label="Theme name"
              onChange={(event) => renameTheme(projectId, theme.id, event.target.value)}
              className="mt-3 border-none bg-transparent px-0 font-serif text-2xl text-amber-50 shadow-none focus-visible:ring-0"
            />
            <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs text-amber-100/70">
              <div>
                <dt className="text-amber-200/40">Related ideas</dt>
                <dd className="text-lg text-amber-50">{theme.ideaCount}</dd>
              </div>
              <div>
                <dt className="text-amber-200/40">Stories</dt>
                <dd className="text-lg text-amber-50">{theme.storyCount}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}
