import type { ContentKind, IdeaCard, SpeechComponentRole, SuggestedRole } from '@/lib/types'
import { defaultRoleFromKind } from '@/lib/xp'

export function suggestRolesHeuristic(ideas: IdeaCard[]): SuggestedRole[] {
  return ideas
    .filter((idea) => idea.role === 'unsorted')
    .map((idea) => {
      const role = roleFromText(idea.kind, `${idea.title} ${idea.originalWording}`)
      return {
        ideaId: idea.id,
        role,
        reason: `This sounds like ${role === 'unsorted' ? 'raw material to sort by hand' : role.replace('-', ' ')}.`,
      }
    })
}

function roleFromText(kind: ContentKind, text: string): SpeechComponentRole {
  const value = text.toLowerCase()
  if (/\b(remember this|never forget|last thing|in closing|so what)\b/.test(value))
    return 'last-line'
  if (/\b(do this|go do|i want you to|call to action|start today)\b/.test(value))
    return 'cta'
  if (/\b(imagine|picture this|let me start|the first time)\b/.test(value))
    return 'hook'
  if (/\b(the problem|what pisses|stuck|afraid|they keep)\b/.test(value))
    return 'problem'
  if (/\b(if you leave with|my promise|you will be able)\b/.test(value))
    return 'promise'
  if (/\b(the lesson|what i learned|the point is|here is the truth)\b/.test(value))
    return 'insight'
  return defaultRoleFromKind(kind)
}
