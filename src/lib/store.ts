import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId, nowIso } from '@/lib/ids'
import { OPENING_QUESTION } from '@/lib/questions'
import type {
  Cluster,
  ContentKind,
  ExtractedIdea,
  GameStage,
  IdeaCard,
  SpeechComponentRole,
  SpeechProject,
  SpeakerProfile,
  SuggestedCluster,
} from '@/lib/types'
import { createDefaultSections, mergeSections } from '@/lib/speech-structure'
import { computeInfluenceScore, xpForKind, XP } from '@/lib/xp'

interface SpeakerState {
  hasHydrated: boolean
  speaker: SpeakerProfile | null
  projects: SpeechProject[]
  setHasHydrated: (value: boolean) => void
  createSpeaker: (input: { name: string; thinkingAbout: string }) => SpeakerProfile
  createProject: (input: { title: string; importedSpeech?: string }) => SpeechProject
  getProject: (projectId: string) => SpeechProject | undefined
  setStage: (projectId: string, stage: GameStage) => void
  saveMessages: (
    projectId: string,
    messages: Array<{ id: string; role: 'user' | 'assistant'; text: string }>
  ) => void
  addExtractedIdeas: (
    projectId: string,
    ideas: ExtractedIdea[],
    sourceMessageId?: string
  ) => IdeaCard[]
  createCluster: (projectId: string, ideaIds: string[], name?: string) => Cluster | null
  moveIdeaToCluster: (projectId: string, ideaId: string, clusterId: string | null) => void
  nameCluster: (
    projectId: string,
    clusterId: string,
    name: string,
    awardXp?: boolean
  ) => void
  applySuggestedCluster: (projectId: string, suggestion: SuggestedCluster) => Cluster | null
  splitCluster: (projectId: string, clusterId: string) => void
  markIdeaStatus: (projectId: string, ideaId: string, status: IdeaCard['status']) => void
  classifyIdea: (projectId: string, ideaId: string, role: SpeechComponentRole) => void
  classifyIdeas: (
    projectId: string,
    assignments: Array<{ ideaId: string; role: SpeechComponentRole }>
  ) => void
  placeIdeaInSlot: (
    projectId: string,
    ideaId: string,
    sectionKey: string | null,
    slotKey?: string | null
  ) => void
  promoteClustersToThemes: (projectId: string) => void
  renameTheme: (projectId: string, themeId: string, name: string) => void
  endInterviewSession: (projectId: string) => void
}

function normalizeProject(project: SpeechProject): SpeechProject {
  const ideas = project.ideas.map((idea) => ({
    ...idea,
    role: idea.role ?? 'unsorted',
  }))
  return {
    ...project,
    ideas,
    sections: mergeSections(project.sections ?? createDefaultSections()),
  }
}

function refreshProject(project: SpeechProject): SpeechProject {
  const normalized = normalizeProject(project)
  const classifiedCount = normalized.ideas.filter((idea) => idea.role !== 'unsorted').length
  const placedCount = normalized.ideas.filter((idea) => idea.sectionKey && idea.slotKey).length
  return {
    ...normalized,
    updatedAt: nowIso(),
    influenceScore: computeInfluenceScore({
      ideaCount: normalized.ideas.length,
      classifiedCount,
      placedCount,
      clusterCount: normalized.clusters.length,
      namedThemeCount: normalized.themes.length,
      xp: normalized.xp,
    }),
  }
}

function award(
  project: SpeechProject,
  amount: number,
  reason: string
): SpeechProject {
  if (amount <= 0) return project
  const session = project.sessions.at(-1)
  return {
    ...project,
    xp: project.xp + amount,
    xpLog: [
      ...project.xpLog,
      { id: createId(), amount, reason, createdAt: nowIso() },
    ],
    sessions: session
      ? project.sessions.map((item, index) =>
          index === project.sessions.length - 1
            ? {
                ...item,
                xpEarned: item.xpEarned + amount,
              }
            : item
        )
      : project.sessions,
  }
}

function updateProject(
  projects: SpeechProject[],
  projectId: string,
  updater: (project: SpeechProject) => SpeechProject
) {
  return projects.map((project) =>
    project.id === projectId ? refreshProject(updater(project)) : project
  )
}

export const useSpeakerStore = create<SpeakerState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      speaker: null,
      projects: [],
      setHasHydrated: (value) => set({ hasHydrated: value }),
      createSpeaker: ({ name, thinkingAbout }) => {
        const speaker: SpeakerProfile = {
          id: createId(),
          name: name.trim(),
          thinkingAbout: thinkingAbout.trim(),
          createdAt: nowIso(),
        }
        set({ speaker })
        return speaker
      },
      createProject: ({ title, importedSpeech }) => {
        const project: SpeechProject = {
          id: createId(),
          title: title.trim() || 'Untitled Discovery',
          createdAt: nowIso(),
          updatedAt: nowIso(),
          stage: 'interview',
          xp: 0,
          influenceScore: 12,
          ideas: [],
          sections: createDefaultSections(),
          clusters: [],
          themes: [],
          messages: [
            {
              id: createId(),
              role: 'assistant',
              text: OPENING_QUESTION,
              createdAt: nowIso(),
            },
          ],
          xpLog: [],
          sessions: [
            {
              id: createId(),
              startedAt: nowIso(),
              ideasCreated: 0,
              xpEarned: 0,
            },
          ],
          importedSpeech: importedSpeech?.trim() || undefined,
        }
        set((state) => ({ projects: [project, ...state.projects] }))
        return project
      },
      getProject: (projectId) => {
        const project = get().projects.find((item) => item.id === projectId)
        return project ? normalizeProject(project) : undefined
      },
      setStage: (projectId, stage) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            stage,
          })),
        })),
      saveMessages: (projectId, messages) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            messages: messages.map((message) => ({
              id: message.id,
              role: message.role,
              text: message.text,
              createdAt:
                project.messages.find((item) => item.id === message.id)?.createdAt ??
                nowIso(),
            })),
          })),
        })),
      addExtractedIdeas: (projectId, ideas, sourceMessageId) => {
        let created: IdeaCard[] = []
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => {
            const existing = new Set(
              project.ideas.map((idea) => idea.title.toLowerCase())
            )
            created = ideas
              .filter((idea) => !existing.has(idea.title.toLowerCase()))
              .map((idea, index) => {
                const card: IdeaCard = {
                  id: createId(),
                  number: project.ideas.length + index + 1,
                  kind: idea.kind,
                  role: 'unsorted',
                  title: idea.title,
                  rawTranscript: idea.rawTranscript,
                  originalWording: idea.originalWording,
                  status: 'raw',
                  tags: [idea.kind],
                  sourceMessageId,
                  createdAt: nowIso(),
                }
                return card
              })
            if (created.length === 0) return project
            const xpGained = created.reduce(
              (sum, card) => sum + xpForKind(card.kind),
              0
            )
            const session = project.sessions.at(-1)
            const next = award(
              {
                ...project,
                ideas: [...project.ideas, ...created],
                sessions: session
                  ? project.sessions.map((item, index) =>
                      index === project.sessions.length - 1
                        ? {
                            ...item,
                            ideasCreated: item.ideasCreated + created.length,
                          }
                        : item
                    )
                  : project.sessions,
              },
              xpGained,
              `${created.length} new card${created.length === 1 ? '' : 's'}`
            )
            return next
          }),
        }))
        return created
      },
      createCluster: (projectId, ideaIds, name) => {
        let cluster: Cluster | null = null
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => {
            const uniqueIds = [...new Set(ideaIds)].filter((id) =>
              project.ideas.some((idea) => idea.id === id)
            )
            if (uniqueIds.length === 0) return project
            const createdCluster: Cluster = {
              id: createId(),
              name: name?.trim() || 'Untitled cluster',
              ideaIds: uniqueIds,
              isNamed: Boolean(name?.trim()),
              isAiSuggested: false,
              matchXpAwarded: uniqueIds.length >= 3,
              nameXpAwarded: Boolean(name?.trim()),
              createdAt: nowIso(),
            }
            cluster = createdCluster
            let next: SpeechProject = {
              ...project,
              clusters: [...project.clusters, createdCluster],
              ideas: project.ideas.map((idea) =>
                uniqueIds.includes(idea.id)
                  ? { ...idea, clusterId: createdCluster.id, status: 'clustered' }
                  : idea
              ),
            }
            next = award(next, XP.createCluster, 'Created a cluster')
            if (uniqueIds.length >= 3)
              next = award(next, XP.matchThree, 'Matched 3 related ideas')
            if (name?.trim())
              next = award(next, XP.nameCluster, `Named cluster: ${name.trim()}`)
            return next
          }),
        }))
        return cluster
      },
      moveIdeaToCluster: (projectId, ideaId, clusterId) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => {
            let next: SpeechProject = {
              ...project,
              clusters: project.clusters
                .map((cluster) => ({
                  ...cluster,
                  ideaIds: cluster.ideaIds.filter((id) => id !== ideaId),
                }))
                .filter((cluster) => cluster.ideaIds.length > 0)
                .map((cluster) =>
                  cluster.id === clusterId && !cluster.ideaIds.includes(ideaId)
                    ? { ...cluster, ideaIds: [...cluster.ideaIds, ideaId] }
                    : cluster
                ),
              ideas: project.ideas.map((idea) =>
                idea.id === ideaId
                  ? {
                      ...idea,
                      clusterId: clusterId ?? undefined,
                      status: clusterId ? 'clustered' : idea.status === 'clustered' ? 'raw' : idea.status,
                    }
                  : idea
              ),
            }
            if (clusterId) {
              const target = next.clusters.find((cluster) => cluster.id === clusterId)
              if (target && target.ideaIds.length >= 3 && !target.matchXpAwarded) {
                next = {
                  ...award(next, XP.matchThree, 'Matched 3 related ideas'),
                  clusters: next.clusters.map((cluster) =>
                    cluster.id === clusterId
                      ? { ...cluster, matchXpAwarded: true }
                      : cluster
                  ),
                }
              }
            }
            return next
          }),
        })),
      nameCluster: (projectId, clusterId, name, awardXp = false) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => {
            const trimmed = name.trim()
            const cluster = project.clusters.find((item) => item.id === clusterId)
            const shouldAward =
              Boolean(awardXp) &&
              Boolean(cluster) &&
              !cluster?.nameXpAwarded &&
              trimmed.length >= 3 &&
              trimmed.toLowerCase() !== 'untitled cluster'
            const next = {
              ...project,
              clusters: project.clusters.map((item) =>
                item.id === clusterId
                  ? {
                      ...item,
                      name: trimmed || item.name,
                      isNamed: shouldAward || item.isNamed || trimmed.length >= 3,
                      nameXpAwarded: shouldAward || item.nameXpAwarded,
                    }
                  : item
              ),
            }
            if (!shouldAward) return next
            return award(next, XP.nameCluster, `Named cluster: ${trimmed}`)
          }),
        })),
      applySuggestedCluster: (projectId, suggestion) => {
        const project = get().getProject(projectId)
        if (!project) return null
        const ideaIds = project.ideas
          .filter((idea) => suggestion.ideaNumbers.includes(idea.number) && !idea.clusterId)
          .map((idea) => idea.id)
        if (ideaIds.length < 2) return null
        const cluster = get().createCluster(projectId, ideaIds, suggestion.proposedName)
        if (!cluster) return null
        set((state) => ({
          projects: updateProject(state.projects, projectId, (current) => ({
            ...current,
            clusters: current.clusters.map((item) =>
              item.id === cluster.id ? { ...item, isAiSuggested: true } : item
            ),
          })),
        }))
        return cluster
      },
      splitCluster: (projectId, clusterId) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            clusters: project.clusters.filter((cluster) => cluster.id !== clusterId),
            ideas: project.ideas.map((idea) =>
              idea.clusterId === clusterId
                ? { ...idea, clusterId: undefined, status: 'raw' }
                : idea
            ),
          })),
        })),
      markIdeaStatus: (projectId, ideaId, status) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            ideas: project.ideas.map((idea) =>
              idea.id === ideaId ? { ...idea, status } : idea
            ),
          })),
        })),
      classifyIdea: (projectId, ideaId, role) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => {
            const idea = project.ideas.find((item) => item.id === ideaId)
            if (!idea) return project
            const shouldAward = role !== 'unsorted' && !idea.classifiedXpAwarded
            const next: SpeechProject = {
              ...project,
              ideas: project.ideas.map((item) =>
                item.id === ideaId
                  ? {
                      ...item,
                      role,
                      status: role === 'unsorted' ? 'raw' : 'classified',
                      classifiedXpAwarded: shouldAward || item.classifiedXpAwarded,
                      tags: Array.from(new Set([...item.tags, role])),
                    }
                  : item
              ),
            }
            if (!shouldAward) return next
            return award(next, XP.classify, `Classified as ${role}`)
          }),
        })),
      classifyIdeas: (projectId, assignments) => {
        for (const assignment of assignments)
          get().classifyIdea(projectId, assignment.ideaId, assignment.role)
      },
      placeIdeaInSlot: (projectId, ideaId, sectionKey, slotKey) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (rawProject) => {
            const project = normalizeProject(rawProject)
            const idea = project.ideas.find((item) => item.id === ideaId)
            if (!idea) return project
            const sections = createDefaultSections().map((section) => {
              const current = project.sections.find((item) => item.key === section.key) ?? section
              return {
                ...current,
                slots: section.slots.map((slot) => {
                  const currentSlot =
                    current.slots.find((item) => item.key === slot.key) ?? slot
                  const withoutIdea = currentSlot.ideaIds.filter((id) => id !== ideaId)
                  const shouldAdd =
                    section.key === sectionKey && slot.key === slotKey
                  return {
                    ...currentSlot,
                    ideaIds: shouldAdd ? [...withoutIdea, ideaId] : withoutIdea,
                  }
                }),
              }
            })
            const targetSlot = sections
              .find((section) => section.key === sectionKey)
              ?.slots.find((slot) => slot.key === slotKey)
            const placed = Boolean(sectionKey && slotKey)
            const shouldAwardPlace = placed && !idea.placedXpAwarded
            let next: SpeechProject = {
              ...project,
              sections,
              ideas: project.ideas.map((item) =>
                item.id === ideaId
                  ? {
                      ...item,
                      sectionKey: sectionKey ?? undefined,
                      slotKey: slotKey ?? undefined,
                      role:
                        placed && item.role === 'unsorted' && targetSlot
                          ? targetSlot.role
                          : item.role,
                      status: placed ? 'placed' : item.role === 'unsorted' ? 'raw' : 'classified',
                      placedXpAwarded: shouldAwardPlace || item.placedXpAwarded,
                    }
                  : item
              ),
            }
            if (shouldAwardPlace)
              next = award(next, XP.placeInSlot, `Placed in ${targetSlot?.label ?? 'section'}`)
            next = {
              ...next,
              sections: next.sections.map((section) => {
                const filledSlots = section.slots.filter((slot) => slot.ideaIds.length > 0).length
                const shouldAwardSection = filledSlots >= 2 && !section.startedXpAwarded
                return shouldAwardSection
                  ? { ...section, startedXpAwarded: true }
                  : section
              }),
            }
            const wasStarted = new Set(
              project.sections
                .filter((section) => section.startedXpAwarded)
                .map((section) => section.key)
            )
            const newlyStarted = next.sections.filter(
              (section) => section.startedXpAwarded && !wasStarted.has(section.key)
            )
            for (const section of newlyStarted)
              next = award(next, XP.startSection, `Started ${section.label} components`)
            return next
          }),
        })),
      promoteClustersToThemes: (projectId) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => {
            const existing = new Set(project.themes.map((theme) => theme.clusterId))
            const named = project.clusters.filter(
              (cluster) => cluster.isNamed && !existing.has(cluster.id)
            )
            if (named.length === 0) return project
            let next = {
              ...project,
              themes: [
                ...project.themes,
                ...named.map((cluster) => ({
                  id: createId(),
                  name: cluster.name,
                  clusterId: cluster.id,
                  ideaCount: cluster.ideaIds.length,
                  storyCount: project.ideas.filter(
                    (idea) =>
                      cluster.ideaIds.includes(idea.id) && idea.kind === 'story'
                  ).length,
                  createdAt: nowIso(),
                })),
              ],
            }
            for (const cluster of named)
              next = award(next, XP.nameTheme, `Named theme: ${cluster.name}`)
            return next
          }),
        })),
      renameTheme: (projectId, themeId, name) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            themes: project.themes.map((theme) =>
              theme.id === themeId ? { ...theme, name: name.trim() } : theme
            ),
          })),
        })),
      endInterviewSession: (projectId) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            stage: 'vault',
            sessions: project.sessions.map((session, index) =>
              index === project.sessions.length - 1
                ? { ...session, endedAt: nowIso() }
                : session
            ),
          })),
        })),
    }),
    {
      name: 'speaker-os-v1',
      partialize: (state) => ({
        speaker: state.speaker,
        projects: state.projects,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<{
          speaker: SpeakerProfile | null
          projects: SpeechProject[]
        }>
        return {
          ...currentState,
          speaker: persisted.speaker ?? currentState.speaker,
          projects: (persisted.projects ?? currentState.projects).map(normalizeProject),
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('Speaker OS failed to restore', error)
        useSpeakerStore.getState().setHasHydrated(true)
      },
    }
  )
)

export function kindAccent(kind: ContentKind) {
  if (kind === 'story') return 'from-amber-200/80 to-orange-100'
  if (kind === 'lesson') return 'from-emerald-200/80 to-lime-100'
  if (kind === 'question') return 'from-sky-200/80 to-indigo-100'
  if (kind === 'quote') return 'from-fuchsia-200/70 to-rose-100'
  return 'from-yellow-100 to-amber-50'
}
