import type { IdeaCard, SuggestedCluster } from '@/lib/types'

function tokens(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
  )
}

function jaccard(a: Set<string>, b: Set<string>) {
  let overlap = 0
  for (const token of a) if (b.has(token)) overlap += 1
  const union = a.size + b.size - overlap
  if (union === 0) return 0
  return overlap / union
}

export function suggestClustersHeuristic(ideas: IdeaCard[]): SuggestedCluster[] {
  const unused = ideas.filter((idea) => !idea.clusterId)
  if (unused.length < 3) return []

  const scored: Array<{ a: IdeaCard; b: IdeaCard; score: number }> = []
  for (let i = 0; i < unused.length; i += 1) {
    for (let j = i + 1; j < unused.length; j += 1) {
      const score = jaccard(
        tokens(`${unused[i].title} ${unused[i].originalWording}`),
        tokens(`${unused[j].title} ${unused[j].originalWording}`)
      )
      if (score >= 0.12) scored.push({ a: unused[i], b: unused[j], score })
    }
  }

  scored.sort((left, right) => right.score - left.score)
  const grouped = new Map<string, Set<number>>()
  const used = new Set<string>()

  for (const pair of scored) {
    if (used.has(pair.a.id) && used.has(pair.b.id)) continue
    const seed = used.has(pair.a.id) ? pair.a.id : pair.b.id
    const key = [...grouped.keys()].find((groupKey) => grouped.get(groupKey)?.has(pair.a.number) || grouped.get(groupKey)?.has(pair.b.number)) ?? seed
    const group = grouped.get(key) ?? new Set<number>()
    group.add(pair.a.number)
    group.add(pair.b.number)
    grouped.set(key, group)
    used.add(pair.a.id)
    used.add(pair.b.id)
  }

  return [...grouped.values()]
    .filter((group) => group.size >= 3)
    .slice(0, 3)
    .map((group) => {
      const members = unused.filter((idea) => group.has(idea.number))
      return {
        ideaNumbers: [...group].sort((a, b) => a - b),
        reason: 'These cards share language, tension, or a related lesson.',
        proposedName: members[0]?.title.split(' ').slice(0, 4).join(' ') || 'Untitled cluster',
      }
    })
}
