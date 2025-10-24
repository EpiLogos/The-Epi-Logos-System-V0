import { EpiiPage } from '@/ui-system/components/pages/EpiiPage';

export default async function Epii({
  searchParams,
}: {
  searchParams?: Promise<{ expand?: string }>;
}) {
  const params = await searchParams;
  const autoExpand = params?.expand === '1';
  return <EpiiPage coordinate="#5" autoExpand={autoExpand} />;
}
