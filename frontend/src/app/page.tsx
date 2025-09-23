import React from 'react';
import { cookies } from 'next/headers';
import { EpiLogosPage } from '@/ui-system/components/pages/EpiLogosPage';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams?: any;
}) {
  const c = await cookies();
  const cookieEntered = c.get('epilogos_entered')?.value === '1';
  const sp = searchParams ? await searchParams : {};
  const qpEntered = sp?.entered === '1' || sp?.state === 'post';
  const initialEntered = Boolean(cookieEntered || qpEntered);
  return <EpiLogosPage initialEntered={initialEntered} />;
}
