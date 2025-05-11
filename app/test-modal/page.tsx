'use client';

import React, { useState } from 'react';
import DebugDealModal from '../components/fundraising/DebugDealModal';

export default function TestModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleOpenModal = () => {
    console.log('Opening modal...');
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    console.log('Closing modal...');
    setIsModalOpen(false);
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Modal Test Page</h1>
      <p className="mb-4">This page tests basic modal functionality.</p>
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleOpenModal}
      >
        Open Test Modal
      </button>
      
      <DebugDealModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        dealId="test-123"
        dealTitle="Test Deal"
      />
    </div>
  );
} 