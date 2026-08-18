import { InterviewStudio } from '@/components/game/interview-studio'

export default async function InterviewPage({
  params,
}: PageProps<'/play/[projectId]/interview'>) {
  const { projectId } = await params
  return <InterviewStudio projectId={projectId} />
}
