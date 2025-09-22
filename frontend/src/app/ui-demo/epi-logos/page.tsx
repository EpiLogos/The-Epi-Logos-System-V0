import React from 'react';
import { cookies } from 'next/headers';
import { EpiLogosPage } from '@/ui-system/components/pages/EpiLogosPage';

export default function UIEpiLogosDemo({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const c = cookies();
  const cookieEntered = c.get('epilogos_entered')?.value === '1';
  const sp = searchParams || {};
  const qpEntered = sp.entered === '1' || sp.state === 'post';
  const initialEntered = Boolean(cookieEntered || qpEntered);
  return <EpiLogosPage initialEntered={initialEntered} />;
}
