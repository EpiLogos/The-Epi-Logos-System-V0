import { ParashaktiPage } from '@/ui-system/components/pages/ParashaktiPage';

export default async function Parashakti({
  searchParams,
}: {
  searchParams?: Promise<{ expand?: string }>;
}) {
  const params = await searchParams;
  const autoExpand = params?.expand === '1';
  return <ParashaktiPage coordinate="#2" autoExpand={autoExpand} />;
}

