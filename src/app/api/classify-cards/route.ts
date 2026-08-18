import { generateText, Output } from 'ai'
import { z } from 'zod'
import { suggestRolesHeuristic } from '@/lib/classify-roles'
import { AI_MODEL, CLASSIFY_INSTRUCTIONS } from '@/lib/ai/prompts'
import { hasAiKey } from '@/lib/ai/has-key'
import type { IdeaCard, SpeechComponentRole, SuggestedRole } from '@/lib/types'

const roles: SpeechComponentRole[] = [
  'unsorted',
  'hook',
  'relevance',
  'problem',
  'promise',
  'preview',
  'story',
  'insight',
  'evidence',
  'framework',
  'example',
  'humor',
  'callback',
  'recap',
  'cta',
  'last-line',
]

const classifySchema = z.object({
  roles: z.array(
    z.object({
      ideaId: z.string(),
      role: z.enum(roles as [SpeechComponentRole, ...SpeechComponentRole[]]),
      reason: z.string(),
    })
  ),
})

export async function POST(req: Request) {
  const body = (await req.json()) as { ideas?: IdeaCard[] }
  const ideas = body.ideas ?? []
  if (ideas.length === 0) return Response.json({ roles: [] satisfies SuggestedRole[] })

  if (hasAiKey()) {
    try {
      const catalog = ideas
        .map(
          (idea) =>
            `${idea.id} | #${idea.number} | material:${idea.kind} | current:${idea.role ?? 'unsorted'} | ${idea.title} — ${idea.originalWording}`
        )
        .join('\n')
      const { output } = await generateText({
        model: AI_MODEL,
        instructions: CLASSIFY_INSTRUCTIONS,
        output: Output.object({ schema: classifySchema }),
        prompt: `Classify these brain-dump cards into speech-component roles.\n${catalog}`,
      })
      if (output?.roles) return Response.json({ roles: output.roles })
    } catch {
      // Fall through to heuristic classification.
    }
  }

  return Response.json({ roles: suggestRolesHeuristic(ideas) })
}
