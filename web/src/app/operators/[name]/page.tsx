import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import OperatorProfileClient from './OperatorProfileClient';

export const metadata: Metadata = {
  title: 'Operator Profile | RRC Monitor',
  description: 'Operator intelligence dashboard with permit analytics and trends',
};

export const revalidate = 300;

async function getOperatorStats(name: string, period: string = 'all') {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/operators/${encodeURIComponent(name)}/api/stats?period=${period}`, {
    next: { revalidate: 300 },
  });
  
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch operator stats');
  }
  
  return res.json();
}

export default async function OperatorProfilePage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams: { period?: string };
}) {
  const operatorName = decodeURIComponent(params.name);
  const period = searchParams.period || 'all';
  
  const data = await getOperatorStats(operatorName, period);
  
  if (!data) {
    notFound();
  }

  return <OperatorProfileClient initialData={data} operatorName={operatorName} />;
}
