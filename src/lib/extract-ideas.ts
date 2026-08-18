import type { ContentKind, ExtractedIdea } from '@/lib/types'

const STORY_HINTS =
  /\b(when i|i remember|years ago|one time|i was|my first|happened to me|that day|the night|i used to)\b/i
const QUESTION_HINTS = /\?$|^\s*(why|what|how|when|who|where)\b/i
const LESSON_HINTS =
  /\b(the lesson|what i learned|never|always|the truth is|people should|the point is)\b/i
const QUOTE_HINTS = /^["“]|said\b|quote\b/i

function classify(text: string): ContentKind {
  if (STORY_HINTS.test(text)) return 'story'
  if (QUESTION_HINTS.test(text)) return 'question'
  if (LESSON_HINTS.test(text)) return 'lesson'
  if (QUOTE_HINTS.test(text)) return 'quote'
  return 'idea'
}

function cleanTitle(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length <= 90) return compact.replace(/[.?!]+$/, '')
  return `${compact.slice(0, 87).replace(/[.?!,:;]+$/, '')}…`
}

function splitThoughts(text: string) {
  const blocks = text
    .split(/\n+/)
    .flatMap((block) => block.split(/(?<=[.?!])\s+(?=[A-Z“"I])/))
    .map((part) => part.trim())
    .filter((part) => part.length >= 18)

  if (blocks.length > 0) return blocks
  const trimmed = text.trim()
  return trimmed.length >= 12 ? [trimmed] : []
}

export function extractIdeasHeuristic({
  text,
  existingTitles,
}: {
  text: string
  existingTitles: string[]
}) {
  const known = new Set(existingTitles.map((title) => title.toLowerCase()))
  const ideas: ExtractedIdea[] = []

  for (const thought of splitThoughts(text)) {
    const title = cleanTitle(thought)
    const key = title.toLowerCase()
    if (known.has(key)) continue
    known.add(key)
    ideas.push({
      title,
      kind: classify(thought),
      originalWording: thought.trim(),
      rawTranscript: thought.trim(),
    })
  }

  return ideas.slice(0, 8)
}
