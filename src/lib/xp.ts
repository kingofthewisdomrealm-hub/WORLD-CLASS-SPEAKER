import type { ContentKind } from '@/lib/types'

export const XP = {
  idea: 10,
  story: 20,
  lesson: 15,
  question: 10,
  quote: 10,
  data: 15,
  framework: 20,
  metaphor: 10,
  humor: 10,
  'audience-pain': 15,
  'audience-desire': 15,
  cta: 10,
  matchThree: 30,
  nameCluster: 20,
  createCluster: 25,
  nameTheme: 25,
} as const

export function xpForKind(kind: ContentKind) {
  return XP[kind]
}

export function speakerLevel(xp: number) {
  if (xp >= 1000)
    return { rank: 5, title: 'Keynoter', nextAt: null as number | null }
  if (xp >= 600) return { rank: 4, title: 'Speaker', nextAt: 1000 }
  if (xp >= 300) return { rank: 3, title: 'Storyteller', nextAt: 600 }
  if (xp >= 100) return { rank: 2, title: 'Explorer', nextAt: 300 }
  return { rank: 1, title: 'Initiate', nextAt: 100 }
}

export function influenceRating(score: number) {
  if (score >= 90) return 'OUTSTANDING'
  if (score >= 75) return 'EXCELLENT'
  if (score >= 60) return 'STRONG'
  if (score >= 40) return 'RISING'
  if (score >= 20) return 'FORMING'
  return 'DISCOVERING'
}

export function computeInfluenceScore({
  ideaCount,
  clusterCount,
  namedThemeCount,
  xp,
}: {
  ideaCount: number
  clusterCount: number
  namedThemeCount: number
  xp: number
}) {
  const fromIdeas = Math.min(ideaCount * 3, 40)
  const fromClusters = Math.min(clusterCount * 6, 24)
  const fromThemes = Math.min(namedThemeCount * 8, 24)
  const fromXp = Math.min(Math.floor(xp / 25), 12)
  return Math.min(99, 12 + fromIdeas + fromClusters + fromThemes + fromXp)
}
