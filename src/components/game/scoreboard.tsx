'use client'

import { useSpeakerStore } from '@/lib/store'
import { influenceRating, speakerLevel } from '@/lib/xp'

export function Scoreboard({ projectId }: { projectId: string }) {
  const speaker = useSpeakerStore((state) => state.speaker)
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )

  if (!project || !speaker) return null

  const level = speakerLevel(project.xp)
  const latest = project.sessions.at(-1)
  const todayXp = project.xpLog
    .filter((entry) => new Date(entry.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
          SPEAKER SCOREBOARD
        </p>
        <h1 className="font-serif text-3xl text-amber-50">{speaker.name}</h1>
      </header>
      <section className="scoreboard-panel rounded-3xl border border-amber-300/20 bg-black/40 p-8 text-center">
        <p className="font-mono text-xs tracking-[0.35em] text-amber-300/70">
          INFLUENCE SCORE
        </p>
        <p className="led-number mt-2 font-mono text-8xl font-semibold tracking-tight text-amber-300 sm:text-9xl">
          {project.influenceScore}
        </p>
        <p className="mt-3 font-mono text-xl tracking-[0.28em] text-amber-50">
          {influenceRating(project.influenceScore)}
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Speaker Level" value={level.title} />
        <Stat label="XP" value={String(project.xp)} />
        <Stat label="Cards" value={String(project.ideas.length)} />
        <Stat
          label="Placed"
          value={String(
            project.ideas.filter((idea) => idea.sectionKey && idea.slotKey).length
          )}
        />
      </section>
      <section className="rounded-2xl border border-amber-200/10 bg-black/25 p-6">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">TODAY</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label="XP Earned" value={String(todayXp)} />
          <Stat label="Session Ideas" value={String(latest?.ideasCreated ?? 0)} />
          <Stat
            label="Classified"
            value={String(
              project.ideas.filter((idea) => idea.role && idea.role !== 'unsorted').length
            )}
          />
        </div>
      </section>
      <section className="rounded-2xl border border-amber-200/10 bg-black/25 p-6">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
          SESSION HISTORY
        </p>
        <ul className="mt-4 space-y-3">
          {project.sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/10 pb-3 font-mono text-sm text-amber-100/75"
            >
              <span>{new Date(session.startedAt).toLocaleString()}</span>
              <span>{session.ideasCreated} ideas</span>
              <span>+{session.xpEarned} XP</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-amber-200/10 bg-black/30 p-4">
      <p className="font-mono text-[10px] tracking-[0.22em] text-amber-200/45">{label}</p>
      <p className="mt-2 font-mono text-2xl text-amber-100">{value}</p>
    </div>
  )
}
