'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSpeakerStore } from '@/lib/store'

export function CreateSpeakerForm() {
  const router = useRouter()
  const hasHydrated = useSpeakerStore((state) => state.hasHydrated)
  const speaker = useSpeakerStore((state) => state.speaker)
  const createSpeaker = useSpeakerStore((state) => state.createSpeaker)
  const [name, setName] = useState(speaker?.name ?? '')
  const [thinkingAbout, setThinkingAbout] = useState(speaker?.thinkingAbout ?? '')

  if (!hasHydrated) return null

  function handleSubmit() {
    if (!name.trim()) return
    createSpeaker({ name, thinkingAbout })
    router.push('/create-project')
  }

  return (
    <div className="stage-bg flex min-h-screen items-center justify-center px-6 py-16">
      <form
        className="w-full max-w-lg space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
          CREATE SPEAKER
        </p>
        <h1 className="font-serif text-4xl text-amber-50">Who is walking onstage?</h1>
        <p className="text-amber-100/60">
          Not a brand bio. Just the person who has something to say.
        </p>
        <div className="space-y-2">
          <label htmlFor="speaker-name" className="text-sm text-amber-100/80">
            Name
          </label>
          <Input
            id="speaker-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-11 border-amber-200/15 bg-black/30 text-amber-50"
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="thinking-about" className="text-sm text-amber-100/80">
            What have you been thinking about lately?
          </label>
          <Textarea
            id="thinking-about"
            value={thinkingAbout}
            onChange={(event) => setThinkingAbout(event.target.value)}
            className="min-h-28 border-amber-200/15 bg-black/30 text-amber-50"
            placeholder="Unfinished thoughts welcome."
          />
        </div>
        <Button type="submit" size="lg" disabled={!name.trim()}>
          Continue
        </Button>
      </form>
    </div>
  )
}
