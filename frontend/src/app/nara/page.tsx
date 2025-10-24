import { NaraPage } from '@/ui-system/components/pages/NaraPage';

export default async function Nara({
  searchParams,
}: {
  searchParams?: Promise<{ expand?: string }>;
}) {
  const params = await searchParams;
  const autoExpand = params?.expand === '1';
  return <NaraPage coordinate="#4" autoExpand={autoExpand} />;
}
