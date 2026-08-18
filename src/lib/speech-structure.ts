import type { SpeechComponentRole, SpeechSection } from '@/lib/types'

export interface SlotBlueprint {
  key: string
  label: string
  hint: string
  role: SpeechComponentRole
}

export interface SectionBlueprint {
  key: string
  label: string
  hint: string
  slots: SlotBlueprint[]
}

export const SPEECH_BLUEPRINT: SectionBlueprint[] = [
  {
    key: 'introduction',
    label: 'Introduction',
    hint: 'The cards that make the opening.',
    slots: [
      { key: 'hook', label: 'Hook', hint: 'The first grab.', role: 'hook' },
      {
        key: 'relevance',
        label: 'Why this room',
        hint: 'Why these people should care.',
        role: 'relevance',
      },
      {
        key: 'problem',
        label: 'Opening problem',
        hint: 'The tension you name early.',
        role: 'problem',
      },
      {
        key: 'promise',
        label: 'Promise',
        hint: 'What this talk will give them.',
        role: 'promise',
      },
      {
        key: 'preview',
        label: 'Preview',
        hint: 'The road ahead, in one breath.',
        role: 'preview',
      },
    ],
  },
  {
    key: 'body',
    label: 'Body',
    hint: 'The cards that carry the argument.',
    slots: [
      { key: 'story', label: 'Story', hint: 'Lived experience.', role: 'story' },
      { key: 'insight', label: 'Insight', hint: 'The turn in thinking.', role: 'insight' },
      { key: 'evidence', label: 'Evidence', hint: 'Proof, data, example.', role: 'evidence' },
      {
        key: 'framework',
        label: 'Framework',
        hint: 'A model they can reuse.',
        role: 'framework',
      },
      { key: 'example', label: 'Example', hint: 'Make it concrete.', role: 'example' },
      { key: 'humor', label: 'Humor', hint: 'Release and connection.', role: 'humor' },
    ],
  },
  {
    key: 'conclusion',
    label: 'Conclusion',
    hint: 'The cards that land the talk.',
    slots: [
      {
        key: 'callback',
        label: 'Callback',
        hint: 'Return to the opening.',
        role: 'callback',
      },
      { key: 'recap', label: 'Recap', hint: 'What to remember.', role: 'recap' },
      {
        key: 'cta',
        label: 'Call to action',
        hint: 'What to do next.',
        role: 'cta',
      },
      {
        key: 'last-line',
        label: 'Last line',
        hint: 'The final image or sentence.',
        role: 'last-line',
      },
    ],
  },
]

export const SPEECH_ROLE_LABELS: Record<SpeechComponentRole, string> = {
  unsorted: 'Unsorted',
  hook: 'Hook',
  relevance: 'Why this room',
  problem: 'Problem',
  promise: 'Promise',
  preview: 'Preview',
  story: 'Story',
  insight: 'Insight',
  evidence: 'Evidence',
  framework: 'Framework',
  example: 'Example',
  humor: 'Humor',
  callback: 'Callback',
  recap: 'Recap',
  cta: 'Call to action',
  'last-line': 'Last line',
}

export const ROLE_FAMILIES: Array<{
  label: string
  roles: SpeechComponentRole[]
}> = [
  {
    label: 'Introduction',
    roles: ['hook', 'relevance', 'problem', 'promise', 'preview'],
  },
  {
    label: 'Body',
    roles: ['story', 'insight', 'evidence', 'framework', 'example', 'humor'],
  },
  {
    label: 'Conclusion',
    roles: ['callback', 'recap', 'cta', 'last-line'],
  },
]

export function createDefaultSections(): SpeechSection[] {
  return SPEECH_BLUEPRINT.map((section) => ({
    key: section.key,
    label: section.label,
    hint: section.hint,
    startedXpAwarded: false,
    slots: section.slots.map((slot) => ({
      key: slot.key,
      label: slot.label,
      hint: slot.hint,
      role: slot.role,
      ideaIds: [],
    })),
  }))
}

export function mergeSections(existing: SpeechSection[]): SpeechSection[] {
  const byKey = new Map(existing.map((section) => [section.key, section]))
  return SPEECH_BLUEPRINT.map((blueprint) => {
    const current = byKey.get(blueprint.key)
    const slotsByKey = new Map((current?.slots ?? []).map((slot) => [slot.key, slot]))
    return {
      key: blueprint.key,
      label: blueprint.label,
      hint: blueprint.hint,
      startedXpAwarded: current?.startedXpAwarded ?? false,
      slots: blueprint.slots.map((slot) => ({
        key: slot.key,
        label: slot.label,
        hint: slot.hint,
        role: slot.role,
        ideaIds: slotsByKey.get(slot.key)?.ideaIds ?? [],
      })),
    }
  })
}

export function slotDropId(sectionKey: string, slotKey: string) {
  return `${sectionKey}::${slotKey}`
}

export function parseSlotDropId(id: string) {
  const [sectionKey, slotKey] = id.split('::')
  if (!sectionKey || !slotKey) return null
  return { sectionKey, slotKey }
}
