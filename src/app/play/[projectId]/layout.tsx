import { GameShell } from '@/components/game/game-shell'

export default async function PlayLayout({
  children,
  params,
}: LayoutProps<'/play/[projectId]'>) {
  const { projectId } = await params
  return <GameShell projectId={projectId}>{children}</GameShell>
}
