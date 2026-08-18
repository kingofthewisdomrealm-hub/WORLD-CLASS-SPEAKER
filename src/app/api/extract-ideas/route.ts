import { generateText, Output } from 'ai'
import { z } from 'zod'
import { extractIdeasHeuristic } from '@/lib/extract-ideas'
import { AI_MODEL, EXTRACT_INSTRUCTIONS } from '@/lib/ai/prompts'
import { hasAiKey } from '@/lib/ai/has-key'
import type { ContentKind, ExtractedIdea } from '@/lib/types'

const kinds: ContentKind[] = [
  'idea',
  'story',
  'lesson',
  'question',
  'quote',
  'data',
  'framework',
  'metaphor',
  'humor',
  'audience-pain',
  'audience-desire',
  'cta',
]

const extractSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      kind: z.enum(kinds as [ContentKind, ...ContentKind[]]),
      originalWording: z.string(),
      rawTranscript: z.string(),
    })
  ),
})

export async function POST(req: Request) {
  const body = (await req.json()) as {
    text?: string
    existingTitles?: string[]
  }
  const text = body.text?.trim() ?? ''
  const existingTitles = body.existingTitles ?? []

  if (!text) return Response.json({ ideas: [] satisfies ExtractedIdea[] })

  if (hasAiKey()) {
    try {
      const { output } = await generateText({
        model: AI_MODEL,
        instructions: EXTRACT_INSTRUCTIONS,
        output: Output.object({ schema: extractSchema }),
        prompt: `Existing idea titles to avoid duplicating:\n${existingTitles.join('\n') || '(none)'}\n\nSpeaker answer:\n${text}`,
      })
      if (output?.ideas) return Response.json({ ideas: output.ideas })
    } catch {
      // Fall through to heuristic extraction so the game still plays.
    }
  }

  return Response.json({
    ideas: extractIdeasHeuristic({ text, existingTitles }),
  })
}
