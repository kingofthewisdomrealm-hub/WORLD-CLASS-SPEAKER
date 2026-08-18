'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSpeakerStore } from '@/lib/store'

export function CreateProjectForm() {
  const router = useRouter()
  const hasHydrated = useSpeakerStore((state) => state.hasHydrated)
  const speaker = useSpeakerStore((state) => state.speaker)
  const createProject = useSpeakerStore((state) => state.createProject)
  const [title, setTitle] = useState('Untitled Discovery')
  const [importedSpeech, setImportedSpeech] = useState('')

  useEffect(() => {
    if (hasHydrated && !speaker) router.replace('/create-speaker')
  }, [hasHydrated, speaker, router])

  if (!hasHydrated || !speaker) return null

  function handleSubmit() {
    const project = createProject({ title, importedSpeech })
    router.push(`/play/${project.id}/interview`)
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
          CREATE SPEECH PROJECT
        </p>
        <h1 className="font-serif text-4xl text-amber-50">A working title is enough.</h1>
        <p className="text-amber-100/60">
          You are not naming the keynote yet. You are opening a vault.
        </p>
        <div className="space-y-2">
          <label htmlFor="project-title" className="text-sm text-amber-100/80">
            Project name
          </label>
          <Input
            id="project-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-11 border-amber-200/15 bg-black/30 text-amber-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="imported-speech" className="text-sm text-amber-100/80">
            Paste an existing speech or notes (optional)
          </label>
          <Textarea
            id="imported-speech"
            value={importedSpeech}
            onChange={(event) => setImportedSpeech(event.target.value)}
            className="min-h-32 border-amber-200/15 bg-black/30 text-amber-50"
            placeholder="Old drafts, fragments, outlines, rants…"
          />
        </div>
        <Button type="submit" size="lg">
          Enter the interview
        </Button>
      </form>
    </div>
  )
}
