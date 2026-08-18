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
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IdeaCardView } from '@/components/game/idea-card-view'
import { createDefaultSections, parseSlotDropId, slotDropId, SPEECH_ROLE_LABELS } from '@/lib/speech-structure'
import { useSpeakerStore } from '@/lib/store'
import type { IdeaCard } from '@/lib/types'
import { cn } from '@/lib/utils'

function DraggableIdea({ idea }: { idea: IdeaCard }) {
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
      <IdeaCardView idea={idea} compact isDragging={isDragging} />
    </div>
  )
}

function PoolZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  return (
    <section
      ref={setNodeRef}
      className={cn(
        'h-fit rounded-2xl border border-amber-200/10 bg-black/20 p-4',
        isOver && 'border-amber-300/40'
      )}
    >
      <p className="font-mono text-[10px] tracking-[0.22em] text-amber-300/70">
        UNPLACED CARDS
      </p>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  )
}

function SlotTray({
  dropId,
  label,
  hint,
  children,
}: {
  dropId: string
  label: string
  hint: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-28 rounded-xl border border-amber-200/10 bg-black/30 p-3',
        isOver && 'border-amber-300/50 bg-amber-300/5'
      )}
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-amber-300/70">{label}</p>
      <p className="mb-2 text-[11px] text-amber-100/40">{hint}</p>
      <div className="grid gap-2">{children}</div>
    </div>
  )
}

export function OrganizeBoard({ projectId }: { projectId: string }) {
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )
  const placeIdeaInSlot = useSpeakerStore((state) => state.placeIdeaInSlot)
  const setStage = useSpeakerStore((state) => state.setStage)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  if (!project) return null

  const sections = project.sections?.length ? project.sections : createDefaultSections()
  const placedIds = new Set(
    sections.flatMap((section) => section.slots.flatMap((slot) => slot.ideaIds))
  )
  const pool = project.ideas.filter((idea) => !placedIds.has(idea.id))

  function handleDragEnd(event: DragEndEvent) {
    const ideaId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null
    if (!overId) return
    if (overId === 'pool') {
      placeIdeaInSlot(projectId, ideaId, null, null)
      return
    }
    const parsed = parseSlotDropId(overId)
    if (!parsed) return
    placeIdeaInSlot(projectId, ideaId, parsed.sectionKey, parsed.slotKey)
    toast.success('+15 XP · Placed in a speech component')
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/70">
              LEVEL 1 · ORGANIZE
            </p>
            <h1 className="font-serif text-4xl text-amber-50">
              Components of the components.
            </h1>
            <p className="mt-2 max-w-2xl text-amber-100/60">
              The introduction is a card. Inside it are the cards that make an introduction. Same for the conclusion. Drag your material into the job it might do.
            </p>
          </div>
          <Button asChild onClick={() => setStage(projectId, 'scoreboard')}>
            <Link href={`/play/${projectId}/scoreboard`}>Open scoreboard</Link>
          </Button>
        </header>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <PoolZone>
            {pool.map((idea) => (
              <DraggableIdea key={idea.id} idea={idea} />
            ))}
            {pool.length === 0 && (
              <p className="text-sm text-amber-100/45">Every card has a place — for now.</p>
            )}
          </PoolZone>

          <div className="grid gap-5">
            {sections.map((section) => (
              <article
                key={section.key}
                className="rounded-2xl border border-amber-200/15 bg-[oklch(0.2_0.025_60)] p-5 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.8)]"
              >
                <p className="font-mono text-[10px] tracking-[0.24em] text-amber-300/70">
                  SECTION CARD
                </p>
                <h2 className="mt-1 font-serif text-3xl text-amber-50">{section.label}</h2>
                <p className="mt-1 text-sm text-amber-100/55">{section.hint}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {section.slots.map((slot) => (
                    <SlotTray
                      key={slot.key}
                      dropId={slotDropId(section.key, slot.key)}
                      label={slot.label.toUpperCase()}
                      hint={slot.hint}
                    >
                      {slot.ideaIds
                        .map((id) => project.ideas.find((idea) => idea.id === id))
                        .filter((idea): idea is IdeaCard => Boolean(idea))
                        .map((idea) => (
                          <DraggableIdea key={idea.id} idea={idea} />
                        ))}
                    </SlotTray>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
        <p className="text-xs text-amber-100/35">
          A card can move. Placement is a guess, not a verdict. {SPEECH_ROLE_LABELS.unsorted} material can still live in the vault.
        </p>
      </div>
    </DndContext>
  )
}
