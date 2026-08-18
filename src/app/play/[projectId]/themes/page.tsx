import { ThemesBoard } from '@/components/game/themes-board'

export default async function ThemesPage({
  params,
}: PageProps<'/play/[projectId]/themes'>) {
  const { projectId } = await params
  return <ThemesBoard projectId={projectId} />
}
