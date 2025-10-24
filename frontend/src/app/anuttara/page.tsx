import { AnuttaraPage } from '@/ui-system/components/pages/AnuttaraPage';

export default async function Anuttara({
  searchParams,
}: {
  searchParams?: Promise<{ expand?: string }>;
}) {
  const params = await searchParams;
  const autoExpand = params?.expand === '1';
  return <AnuttaraPage coordinate="#0" autoExpand={autoExpand} />;
}

