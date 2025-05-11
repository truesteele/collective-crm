'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { supabase } from '@/lib/supabase';
// ... existing code ...

// Create a separate component for handling the client-side logic
function ClientDealDetails({ id }: { id: string }) {
  // All the existing component code here
  const [deal, setDeal] = useState<FundraisingDeal | null>(null);
  // ... existing state definitions ...
  
  const dealId = id; // Use the passed-in id prop
  
  // ... all the existing useEffect, handlers, and render logic ...
}

// Main component that uses the params properly
export default function DealDetailsPage({ params }: { params: { id: string } }) {
  // Properly await params using Next.js use() function
  const unwrappedParams = use(Promise.resolve(params));
  const id = unwrappedParams.id;
  
  return <ClientDealDetails id={id} />;
} 