import { IdeaVault } from '@/components/game/idea-vault'

export default async function VaultPage({
  params,
}: PageProps<'/play/[projectId]/vault'>) {
  const { projectId } = await params
  return <IdeaVault projectId={projectId} />
}
