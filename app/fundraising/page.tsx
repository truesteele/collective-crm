import React from 'react';
import { Suspense } from 'react';
import KanbanWithDetails from '../components/fundraising/KanbanWithDetails';

export const dynamic = 'force-dynamic';

export default function FundraisingPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-4">Fundraising Pipeline</h1>
      <p className="text-muted-foreground mb-8">
        Drag and drop deals between stages or click on a deal to view details.
      </p>
      
      <Suspense fallback={<div className="p-12 text-center">Loading fundraising pipeline...</div>}>
        <KanbanWithDetails />
      </Suspense>
    </div>
  );
} 