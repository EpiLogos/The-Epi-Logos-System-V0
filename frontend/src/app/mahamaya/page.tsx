import { MahamayaPage } from '@/ui-system/components/pages/MahamayaPage';

export default async function Mahamaya({
  searchParams,
}: {
  searchParams?: Promise<{ expand?: string }>;
}) {
  const params = await searchParams;
  const autoExpand = params?.expand === '1';
  return <MahamayaPage coordinate="#3" autoExpand={autoExpand} />;
}

