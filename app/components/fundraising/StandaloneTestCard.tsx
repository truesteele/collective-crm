'use client';

import React, { useState } from 'react';
import DebugDealModal from './DebugDealModal';

export default function StandaloneTestCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    console.log('Standalone card clicked');
    setIsModalOpen(true);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="p-4 border rounded-md shadow-sm cursor-pointer hover:shadow-md transition-all bg-white"
      >
        <h3 className="font-medium">Test Deal</h3>
        <p className="text-sm text-gray-600">Click to open modal</p>
      </div>

      <DebugDealModal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('Closing standalone modal');
          setIsModalOpen(false);
        }}
        dealId="standalone-test"
        dealTitle="Standalone Test Deal"
      />
    </>
  );
} 