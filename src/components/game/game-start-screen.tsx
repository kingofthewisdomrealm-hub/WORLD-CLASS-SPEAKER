'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSpeakerStore } from '@/lib/store'

const LINES = ['GAME START', 'Welcome to Speaker OS.', 'The first objective is not to write your keynote.', 'The first objective is to discover what you have to say.']

export function GameStartScreen() {
  const router = useRouter()
  const hasHydrated = useSpeakerStore((state) => state.hasHydrated)
  const speaker = useSpeakerStore((state) => state.speaker)
  const projects = useSpeakerStore((state) => state.projects)
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!hasHydrated) return
    const timers = LINES.map((_, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), 350 + index * 700)
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [hasHydrated])

  const latest = projects[0]

  function handleStart() {
    if (!speaker) {
      router.push('/create-speaker')
      return
    }
    if (!latest) {
      router.push('/create-project')
      return
    }
    router.push(`/play/${latest.id}/${latest.stage}`)
  }

  return (
    <div className="stage-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(232,195,106,0.16),transparent_42%)]" />
      <div className="relative z-10 w-full max-w-3xl text-center">
        {LINES.map((line, index) => (
          <p
            key={line}
            className={
              index === 0
                ? 'mb-8 font-serif text-6xl tracking-[0.12em] text-amber-50 sm:text-8xl'
                : index === 1
                  ? 'mb-6 font-serif text-3xl text-amber-100 sm:text-4xl'
                  : 'mb-3 text-lg text-amber-100/70'
            }
            style={{
              opacity: visibleCount > index ? 1 : 0,
              transform: visibleCount > index ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 700ms ease, transform 700ms ease',
            }}
          >
            {line}
          </p>
        ))}
        <div
          className="mt-12 flex flex-col items-center gap-3"
          style={{
            opacity: visibleCount >= LINES.length ? 1 : 0,
            transition: 'opacity 600ms ease 200ms',
          }}
        >
          <Button size="lg" onClick={handleStart} className="h-12 px-8 text-base tracking-[0.18em]">
            {speaker && latest ? 'CONTINUE' : 'START GAME'}
          </Button>
          {speaker && latest && (
            <Button
              variant="ghost"
              onClick={() => router.push('/create-project')}
              className="text-amber-100/70"
            >
              New project
            </Button>
          )}
          <p className="mt-2 font-mono text-[11px] tracking-[0.24em] text-amber-200/40">
            GENERATE FIRST. ORGANIZE LATER.
          </p>
        </div>
      </div>
    </div>
  )
}
