'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowRight, Radio } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { IdeaCardView } from '@/components/game/idea-card-view'
import { VoiceInput } from '@/components/game/voice-input'
import { formatIdeaNumber } from '@/lib/ids'
import { fromUiMessages, messageText, toUiMessages } from '@/lib/messages'
import { useSpeakerStore } from '@/lib/store'
import type { ExtractedIdea } from '@/lib/types'
import { KIND_LABELS } from '@/lib/kind-labels'
import { xpForKind } from '@/lib/xp'

interface InterviewStudioProps {
  projectId: string
}

export function InterviewStudio({ projectId }: InterviewStudioProps) {
  const router = useRouter()
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )
  const saveMessages = useSpeakerStore((state) => state.saveMessages)
  const addExtractedIdeas = useSpeakerStore((state) => state.addExtractedIdeas)
  const endInterviewSession = useSpeakerStore((state) => state.endInterviewSession)
  const [draft, setDraft] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const importedRef = useRef(false)
  const [seedMessages] = useState(() => toUiMessages(project?.messages ?? []))

  const { messages, sendMessage, status } = useChat({
    id: projectId,
    messages: seedMessages,
    transport: new DefaultChatTransport({ api: '/api/interview' }),
    onFinish: ({ messages: nextMessages }) => {
      saveMessages(projectId, fromUiMessages(nextMessages))
      const lastUser = [...nextMessages].reverse().find((message) => message.role === 'user')
      if (lastUser) void extractFromText(messageText(lastUser), lastUser.id)
    },
  })

  const isBusy = status === 'submitted' || status === 'streaming' || isExtracting

  async function extractFromText(text: string, sourceMessageId?: string) {
    if (!text.trim()) return
    const current = useSpeakerStore.getState().getProject(projectId)
    if (!current) return
    setIsExtracting(true)
    try {
      const response = await fetch('/api/extract-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          existingTitles: current.ideas.map((idea) => idea.title),
        }),
      })
      const payload = (await response.json()) as { ideas: ExtractedIdea[] }
      const created = addExtractedIdeas(projectId, payload.ideas ?? [], sourceMessageId)
      for (const idea of created) {
        toast.custom(() => (
          <div className="rounded-md border border-amber-400/40 bg-[#1a140e] px-4 py-3 font-mono text-amber-200 shadow-lg">
            <div className="text-[11px] tracking-[0.22em] text-amber-400/80">
              {KIND_LABELS[idea.kind].toUpperCase()} {formatIdeaNumber(idea.number)}
            </div>
            <div className="mt-1 font-serif text-base text-amber-50">{idea.title}</div>
            <div className="mt-1 text-sm text-emerald-300">+{xpForKind(idea.kind)} XP</div>
          </div>
        ))
      }
    } finally {
      setIsExtracting(false)
    }
  }

  useEffect(() => {
    const current = useSpeakerStore.getState().getProject(projectId)
    if (!current?.importedSpeech || importedRef.current) return
    if (current.ideas.length > 0) return
    importedRef.current = true
    void extractFromText(current.importedSpeech)
    // Capture pasted source material once when the interview opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  function handleSubmit() {
    const text = draft.trim()
    if (!text || isBusy) return
    sendMessage({ text })
    setDraft('')
  }

  function handleEndDump() {
    endInterviewSession(projectId)
    router.push(`/play/${projectId}/vault`)
  }

  if (!project) return null

  return (
    <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-amber-200/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,220,150,0.08)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
              LEVEL 1 · THE INTERVIEW
            </p>
            <h1 className="font-serif text-3xl text-amber-50">Podcast studio</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs text-red-200">
            <Radio className="size-3.5 animate-pulse" />
            LIVE
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1 pr-3">
          <div className="space-y-4 pb-6">
            {messages.map((message) => {
              const text = messageText(message)
              if (!text) return null
              const isHost = message.role === 'assistant'
              return (
                <article
                  key={message.id}
                  className={
                    isHost
                      ? 'max-w-[46rem]'
                      : 'ml-auto max-w-[36rem] rounded-2xl border border-amber-200/10 bg-amber-100/5 px-4 py-3'
                  }
                >
                  <p className="mb-1 font-mono text-[10px] tracking-[0.24em] text-amber-400/80">
                    {isHost ? 'HOST' : 'YOU'}
                  </p>
                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-amber-50/90">
                    {text}
                  </p>
                </article>
              )
            })}
            {isBusy && (
              <p className="font-mono text-xs tracking-[0.18em] text-amber-200/60">
                {isExtracting ? 'CAPTURING IDEAS…' : 'HOST IS LISTENING…'}
              </p>
            )}
          </div>
        </ScrollArea>
        <form
          className="mt-4 space-y-3 border-t border-amber-200/10 pt-4"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <label className="sr-only" htmlFor="interview-answer">
            Answer the host
          </label>
          <Textarea
            id="interview-answer"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Speak naturally. Don’t organize. Don’t decide if it’s good."
            className="min-h-24 border-amber-200/15 bg-black/30 text-amber-50 placeholder:text-amber-200/30"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                handleSubmit()
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <VoiceInput
              disabled={isBusy}
              onTranscript={(text) => setDraft(text)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleEndDump}
                className="border-amber-200/20 text-amber-100"
              >
                End brain dump
              </Button>
              <Button type="submit" disabled={isBusy || !draft.trim()}>
                Send
                <ArrowRight />
              </Button>
            </div>
          </div>
        </form>
      </section>
      <aside className="rounded-2xl border border-amber-200/10 bg-[oklch(0.18_0.02_55)] p-4">
        <p className="font-mono text-[11px] tracking-[0.24em] text-amber-300/70">
          IDEA VAULT · LIVE
        </p>
        <h2 className="mt-1 font-serif text-2xl text-amber-50">
          {project.ideas.length} captured
        </h2>
        <p className="mt-1 text-sm text-amber-100/55">
          Every distinct thought becomes a card. Nothing is discarded.
        </p>
        <div className="mt-4 grid gap-3">
          {[...project.ideas].reverse().slice(0, 8).map((idea) => (
            <IdeaCardView key={idea.id} idea={idea} compact />
          ))}
          {project.ideas.length === 0 && (
            <p className="rounded-lg border border-dashed border-amber-200/15 p-4 text-sm text-amber-100/50">
              Ideas will appear here as you talk.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
