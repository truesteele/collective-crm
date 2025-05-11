import { ClientDealDetails } from './client';

// This component is now a Server Component
export default async function DealDetailsPage({ params }: { params: { id: string } }) {
  // Properly await the params object before accessing its properties
  const resolvedParams = await Promise.resolve(params);
  return <ClientDealDetails id={resolvedParams.id} />;
} 