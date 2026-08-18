import { Scoreboard } from '@/components/game/scoreboard'

export default async function ScoreboardPage({
  params,
}: PageProps<'/play/[projectId]/scoreboard'>) {
  const { projectId } = await params
  return <Scoreboard projectId={projectId} />
}
