import { NFSeViewer } from '@/components/nfse/NFSeViewer';

export default async function VisualizarNFSe({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  return <NFSeViewer notaId={id} />;
}