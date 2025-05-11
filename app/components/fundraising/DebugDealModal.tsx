'use client';

import React, { useState, useEffect } from 'react';

interface DebugDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
  dealTitle?: string;
}

export default function DebugDealModal({ 
  isOpen, 
  onClose, 
  dealId,
  dealTitle 
}: DebugDealModalProps) {
  
  // Use state to track if actually visible
  const [isVisible, setIsVisible] = useState(false);
  
  // Sync visibility with isOpen prop
  useEffect(() => {
    console.log('DebugDealModal isOpen changed:', isOpen);
    setIsVisible(isOpen);
  }, [isOpen]);
  
  // Early return if not visible
  if (!isVisible) {
    return null;
  }
  
  // Handle close
  const handleClose = () => {
    console.log('DebugDealModal close button clicked');
    setIsVisible(false);
    onClose();
  };
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          width: '80%',
          maxWidth: '32rem',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Deal Details (Debug Modal)</h2>
        <p>Deal ID: {dealId || 'Not specified'}</p>
        <p>Deal Title: {dealTitle || 'Not specified'}</p>
        <p>This is a fallback debug modal to verify that basic modal functionality works.</p>
        <button 
          onClick={handleClose}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
} 