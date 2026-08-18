import { OrganizeBoard } from '@/components/game/organize-board'

export default async function OrganizePage({
  params,
}: PageProps<'/play/[projectId]/organize'>) {
  const { projectId } = await params
  return <OrganizeBoard projectId={projectId} />
}
