import { ClassifyBoard } from '@/components/game/classify-board'

export default async function ClassifyPage({
  params,
}: PageProps<'/play/[projectId]/classify'>) {
  const { projectId } = await params
  return <ClassifyBoard projectId={projectId} />
}
