import type { ContentKind, SpeechComponentRole } from '@/lib/types'

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
  classify: 10,
  placeInSlot: 15,
  startSection: 25,
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
  classifiedCount,
  placedCount,
  clusterCount,
  namedThemeCount,
  xp,
}: {
  ideaCount: number
  classifiedCount: number
  placedCount: number
  clusterCount: number
  namedThemeCount: number
  xp: number
}) {
  const fromIdeas = Math.min(ideaCount * 2, 28)
  const fromClassified = Math.min(classifiedCount * 2, 18)
  const fromPlaced = Math.min(placedCount * 3, 24)
  const fromClusters = Math.min(clusterCount * 4, 12)
  const fromThemes = Math.min(namedThemeCount * 6, 12)
  const fromXp = Math.min(Math.floor(xp / 25), 12)
  return Math.min(
    99,
    12 + fromIdeas + fromClassified + fromPlaced + fromClusters + fromThemes + fromXp
  )
}

export function defaultRoleFromKind(kind: ContentKind): SpeechComponentRole {
  if (kind === 'story') return 'story'
  if (kind === 'lesson') return 'insight'
  if (kind === 'audience-pain') return 'problem'
  if (kind === 'audience-desire') return 'promise'
  if (kind === 'cta') return 'cta'
  if (kind === 'quote') return 'hook'
  if (kind === 'humor') return 'humor'
  if (kind === 'data') return 'evidence'
  if (kind === 'framework') return 'framework'
  if (kind === 'metaphor') return 'hook'
  if (kind === 'question') return 'hook'
  return 'unsorted'
}
