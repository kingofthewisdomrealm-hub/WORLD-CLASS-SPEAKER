'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSpeakerStore } from '@/lib/store'
import { speakerLevel } from '@/lib/xp'
import { cn } from '@/lib/utils'

const STAGES = [
  { href: 'interview', label: 'Interview' },
  { href: 'vault', label: 'Vault' },
  { href: 'classify', label: 'Classify' },
  { href: 'organize', label: 'Organize' },
  { href: 'scoreboard', label: 'Scoreboard' },
] as const

interface GameShellProps {
  projectId: string
  children: React.ReactNode
}

export function GameShell({ projectId, children }: GameShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const hasHydrated = useSpeakerStore((state) => state.hasHydrated)
  const speaker = useSpeakerStore((state) => state.speaker)
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )

  useEffect(() => {
    if (hasHydrated && (!speaker || !project)) router.replace('/')
  }, [hasHydrated, speaker, project, router])

  if (!hasHydrated)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#120f0c] text-amber-100/70">
        Loading Speaker OS…
      </div>
    )

  if (!speaker || !project) return null

  const level = speakerLevel(project.xp)

  return (
    <div className="stage-bg flex min-h-screen flex-col">
      <header className="border-b border-amber-200/10 bg-black/25">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-serif text-xl text-amber-50">
            Speaker OS
          </Link>
          <nav className="flex flex-wrap gap-1" aria-label="Game stages">
            {STAGES.map((stage) => {
              const href = `/play/${projectId}/${stage.href}`
              const isActive = pathname === href
              return (
                <Link
                  key={stage.href}
                  href={href}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs tracking-[0.16em] uppercase',
                    isActive
                      ? 'bg-amber-300 text-stone-900'
                      : 'text-amber-100/55 hover:text-amber-50'
                  )}
                >
                  {stage.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-4 font-mono text-xs text-amber-100/80">
            <span>{level.title}</span>
            <span className="text-amber-300">{project.xp} XP</span>
            <span>{project.ideas.length} ideas</span>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-6">
        {children}
      </main>
    </div>
  )
}
