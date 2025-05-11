'use client';

import React, { useCallback } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

type Deal = {
  id: string;
  title: string;
  amount?: number;
  organization_id: string;
  organizations?: {
    name: string;
  };
  contact_person_id?: string;
  contact_person?: {
    full_name: string;
  };
};

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Simplified click handler that uses window.location
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    console.log('DealCard clicked:', deal.id, deal.title);
    
    // Prevent the click from affecting the drag functionality
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to deal details page using direct window location
    window.location.href = `/dashboard/fundraising/deals/${deal.id}`;
  }, [deal.id, deal.title]);

  return (
    <Card 
      className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
      onMouseDown={(e) => e.stopPropagation()} // Stop event bubbling
      onTouchStart={(e) => e.stopPropagation()} // Stop event bubbling for touch
    >
      <CardContent className="p-3">
        <div className="font-medium text-sm line-clamp-2 mb-1">{deal.title}</div>
        
        <div className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {deal.organizations?.name || 'Unknown organization'}
        </div>
        
        {deal.contact_person && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-5 w-5">
              <div className="bg-primary/20 text-primary h-full w-full flex items-center justify-center text-xs font-medium">
                {deal.contact_person.full_name.charAt(0)}
              </div>
            </Avatar>
            <span className="text-xs truncate">{deal.contact_person.full_name}</span>
          </div>
        )}
        
        {/* Add a visible button */}
        <Button 
          size="sm" 
          className="w-full mt-2" 
          variant="outline"
          onClick={handleCardClick}
        >
          <Eye className="h-3 w-3 mr-1" /> View Details
        </Button>
      </CardContent>
      
      {deal.amount && (
        <CardFooter className="p-3 pt-0">
          <Badge variant="outline" className="text-xs font-normal">
            {formatCurrency(deal.amount)}
          </Badge>
        </CardFooter>
      )}
    </Card>
  );
} 