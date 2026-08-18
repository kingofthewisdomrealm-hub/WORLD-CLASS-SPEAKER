'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSpeakerStore } from '@/lib/store'

export function ProjectRedirect({ projectId }: { projectId: string }) {
  const router = useRouter()
  const hasHydrated = useSpeakerStore((state) => state.hasHydrated)
  const project = useSpeakerStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )

  useEffect(() => {
    if (!hasHydrated) return
    if (!project) {
      router.replace('/')
      return
    }
    router.replace(`/play/${projectId}/${project.stage}`)
  }, [hasHydrated, project, projectId, router])

  return (
    <p className="py-20 text-center font-mono text-xs tracking-[0.2em] text-amber-200/50">
      LOADING PROJECT…
    </p>
  )
}
