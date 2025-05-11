'use client';

import React, { useState } from 'react';
import DebugDealModal from '../components/fundraising/DebugDealModal';
import StandaloneTestCard from '../components/fundraising/StandaloneTestCard';
import Link from 'next/link';

export default function ModalTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Modal Test Page</h1>
      <p className="mb-4">This page tests basic modal functionality in isolation.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Method 1: Button Test</h2>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={() => {
              console.log('Opening modal from button...');
              setIsModalOpen(true);
            }}
          >
            Open Test Modal
          </button>
          
          <DebugDealModal
            isOpen={isModalOpen}
            onClose={() => {
              console.log('Closing modal from button...');
              setIsModalOpen(false);
            }}
            dealId="button-test"
            dealTitle="Button Test Deal"
          />
        </div>
        
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Method 2: Card Component Test</h2>
          <StandaloneTestCard />
        </div>
      </div>
      
      <div className="mt-4">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
} 