import { ProjectRedirect } from '@/components/game/project-redirect'

export default async function ProjectPage({
  params,
}: PageProps<'/play/[projectId]'>) {
  const { projectId } = await params
  return <ProjectRedirect projectId={projectId} />
}
