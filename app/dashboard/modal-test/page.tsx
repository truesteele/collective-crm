'use client';

import React, { useState } from 'react';
import DebugDealModal from '../../components/fundraising/DebugDealModal';

export default function ModalTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Modal Test Page</h1>
      <p className="mb-4">This page tests basic modal functionality in isolation.</p>
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={() => {
          console.log('Opening modal from test page...');
          setIsModalOpen(true);
        }}
      >
        Open Test Modal
      </button>
      
      <DebugDealModal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('Closing modal from test page...');
          setIsModalOpen(false);
        }}
        dealId="test-123"
        dealTitle="Test Deal"
      />
    </div>
  );
} 