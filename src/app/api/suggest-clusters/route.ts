import { generateText, Output } from 'ai'
import { z } from 'zod'
import { suggestClustersHeuristic } from '@/lib/suggest-clusters'
import { AI_MODEL, CLUSTER_INSTRUCTIONS } from '@/lib/ai/prompts'
import { hasAiKey } from '@/lib/ai/has-key'
import type { IdeaCard, SuggestedCluster } from '@/lib/types'

const clusterSchema = z.object({
  clusters: z.array(
    z.object({
      ideaNumbers: z.array(z.number()),
      reason: z.string(),
      proposedName: z.string(),
    })
  ),
})

export async function POST(req: Request) {
  const body = (await req.json()) as { ideas?: IdeaCard[] }
  const ideas = body.ideas ?? []
  const unclustered = ideas.filter((idea) => !idea.clusterId)

  if (unclustered.length < 2) return Response.json({ clusters: [] satisfies SuggestedCluster[] })

  if (hasAiKey()) {
    try {
      const catalog = unclustered
        .map((idea) => `${idea.number}. [${idea.kind}] ${idea.title} — ${idea.originalWording}`)
        .join('\n')
      const { output } = await generateText({
        model: AI_MODEL,
        instructions: CLUSTER_INSTRUCTIONS,
        output: Output.object({ schema: clusterSchema }),
        prompt: `Idea cards:\n${catalog}`,
      })
      if (output?.clusters) return Response.json({ clusters: output.clusters })
    } catch {
      // Fall through to heuristic matching.
    }
  }

  return Response.json({ clusters: suggestClustersHeuristic(ideas) })
}
