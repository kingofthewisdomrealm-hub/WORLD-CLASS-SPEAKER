import { MatchingBoard } from '@/components/game/matching-board'

export default async function MatchingPage({
  params,
}: PageProps<'/play/[projectId]/matching'>) {
  const { projectId } = await params
  return <MatchingBoard projectId={projectId} />
}
