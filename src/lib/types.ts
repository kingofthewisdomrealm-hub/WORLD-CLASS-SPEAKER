export type GameStage =
  | 'interview'
  | 'vault'
  | 'matching'
  | 'themes'
  | 'scoreboard'

export type ContentKind =
  | 'idea'
  | 'story'
  | 'lesson'
  | 'question'
  | 'quote'
  | 'data'
  | 'framework'
  | 'metaphor'
  | 'humor'
  | 'audience-pain'
  | 'audience-desire'
  | 'cta'

export type IdeaStatus =
  | 'raw'
  | 'interesting'
  | 'unrelated'
  | 'promoted'
  | 'clustered'

export interface SpeakerProfile {
  id: string
  name: string
  thinkingAbout: string
  createdAt: string
}

export interface InterviewMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export interface IdeaCard {
  id: string
  number: number
  kind: ContentKind
  title: string
  rawTranscript: string
  originalWording: string
  theme?: string
  potentialAudience?: string
  status: IdeaStatus
  tags: string[]
  sourceMessageId?: string
  clusterId?: string
  createdAt: string
}

export interface Cluster {
  id: string
  name: string
  ideaIds: string[]
  isNamed: boolean
  isAiSuggested: boolean
  matchXpAwarded: boolean
  nameXpAwarded: boolean
  createdAt: string
}

export interface Theme {
  id: string
  name: string
  clusterId: string
  ideaCount: number
  storyCount: number
  createdAt: string
}

export interface XpTransaction {
  id: string
  amount: number
  reason: string
  createdAt: string
}

export interface GameSession {
  id: string
  startedAt: string
  endedAt?: string
  ideasCreated: number
  xpEarned: number
}

export interface SpeechProject {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  stage: GameStage
  xp: number
  influenceScore: number
  ideas: IdeaCard[]
  clusters: Cluster[]
  themes: Theme[]
  messages: InterviewMessage[]
  xpLog: XpTransaction[]
  sessions: GameSession[]
  importedSpeech?: string
}

export interface ExtractedIdea {
  title: string
  kind: ContentKind
  originalWording: string
  rawTranscript: string
}

export interface SuggestedCluster {
  ideaNumbers: number[]
  reason: string
  proposedName: string
}
