'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';

type Person = {
  id: string;
  full_name: string;
  title?: string;
  work_email?: string;
  phone?: string;
};

type Organization = {
  id: string;
  name: string;
  website_url?: string;
};

type DealNote = {
  id: string;
  content: string;
  created_at: string;
  created_by?: string;
  user?: {
    email?: string;
  };
};

type StageHistory = {
  id: string;
  from_stage?: {
    name: string;
  };
  to_stage: {
    name: string;
  };
  changed_at: string;
  changed_by?: string;
  user?: {
    email?: string;
  };
};

type FundraisingDeal = {
  id: string;
  title: string;
  amount?: number;
  organization_id: string;
  organizations?: Organization;
  contact_person_id?: string;
  contact_person?: Person;
  stage_id: string;
  pipeline_stages?: {
    name: string;
  };
  created_at: string;
  notes?: string;
};

interface DealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
}

export default function DealDetailsModal({
  isOpen,
  onClose,
  dealId,
}: DealDetailsModalProps) {
  // Add logging for props
  console.log('DealDetailsModal props:', { isOpen, dealId });

  const [deal, setDeal] = useState<FundraisingDeal | null>(null);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [contactPeople, setContactPeople] = useState<Person[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const supabase = createClient();

  // Log state changes
  useEffect(() => {
    console.log('DealDetailsModal state:', { 
      isLoading, 
      isOpen, 
      dealId, 
      'deal data exists': !!deal,
      'notes count': notes.length,
      'active tab': activeTab
    });
  }, [isLoading, isOpen, dealId, deal, notes.length, activeTab]);

  // Fetch deal details
  useEffect(() => {
    if (!dealId || !isOpen) {
      console.log('Skipping data fetch - modal closed or no deal ID');
      return;
    }

    console.log('Starting to fetch deal details for ID:', dealId);
    
    const fetchDealDetails = async () => {
      setIsLoading(true);
      
      try {
        // Fetch the main deal data
        const { data: dealData, error: dealError } = await supabase
          .from('fundraising_deals')
          .select(`
            id, 
            title, 
            amount, 
            organization_id,
            organizations (
              id, 
              name, 
              website_url
            ),
            contact_person_id,
            contact_person:people!fundraising_deals_contact_person_id_fkey (
              id, 
              full_name, 
              title, 
              work_email, 
              phone
            ),
            stage_id,
            pipeline_stages (
              name
            ),
            created_at,
            notes
          `)
          .eq('id', dealId)
          .single();

        if (dealError) throw dealError;
        setDeal(dealData);

        // Fetch deal notes
        const { data: notesData, error: notesError } = await supabase
          .from('deal_notes')
          .select(`
            id, 
            content, 
            created_at, 
            created_by,
            user:auth.users!created_by (
              email
            )
          `)
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;
        setNotes(notesData || []);

        // Fetch stage history
        const { data: historyData, error: historyError } = await supabase
          .from('deal_stage_history')
          .select(`
            id, 
            from_stage:pipeline_stages!deal_stage_history_from_stage_id_fkey (
              name
            ),
            to_stage:pipeline_stages!deal_stage_history_to_stage_id_fkey (
              name
            ),
            changed_at, 
            changed_by,
            user:auth.users!changed_by (
              email
            )
          `)
          .eq('deal_id', dealId)
          .order('changed_at', { ascending: false });

        if (historyError) throw historyError;
        setStageHistory(historyData || []);

        // Fetch related people from the organization
        if (dealData?.organization_id) {
          const { data: peopleData, error: peopleError } = await supabase
            .from('people')
            .select('id, full_name, title, work_email, phone')
            .eq('organization_id', dealData.organization_id)
            .order('full_name');

          if (!peopleError && peopleData) {
            setContactPeople(peopleData);
          }
        }
      } catch (error) {
        console.error('Error fetching deal details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDealDetails();
  }, [dealId, isOpen, supabase]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setNewNote('');
      setActiveTab('overview');
    }
  }, [isOpen]);

  // Add this console log to see if the modal is opening with the correct deal ID
  useEffect(() => {
    if (isOpen && dealId) {
      console.log('Opening deal details modal for deal ID:', dealId);
    }
  }, [isOpen, dealId]);

  // Handle adding a new note
  const handleAddNote = async () => {
    if (!newNote.trim() || !dealId) return;

    try {
      const { data, error } = await supabase
        .from('deal_notes')
        .insert({
          deal_id: dealId,
          content: newNote,
        })
        .select(`
          id,
          content,
          created_at,
          created_by,
          user:auth.users!created_by (
            email
          )
        `);

      if (error) throw error;

      if (data && data.length > 0) {
        setNotes([data[0], ...notes]);
        setNewNote('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log('Dialog onOpenChange called with:', open);
        if (!open) {
          console.log('Calling onClose from Dialog');
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : deal ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center justify-between">
                <div className="flex-grow">{deal.title}</div>
                {deal.amount && (
                  <Badge variant="outline" className="ml-4 text-lg font-normal">
                    {formatCurrency(deal.amount)}
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <div>
                  Organization: <span className="font-medium text-foreground">{deal.organizations?.name}</span>
                </div>
                <div className="mx-2">•</div>
                <div>
                  Stage: <span className="font-medium text-foreground">{deal.pipeline_stages?.name}</span>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Deal Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">Title:</span> {deal.title}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span> {formatCurrency(deal.amount)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stage:</span> {deal.pipeline_stages?.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>{' '}
                        {deal.created_at && formatDistanceToNow(new Date(deal.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Organization</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">Name:</span> {deal.organizations?.name}
                      </div>
                      {deal.organizations?.website_url && (
                        <div>
                          <span className="text-muted-foreground">Website:</span>{' '}
                          <a
                            href={deal.organizations.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {deal.organizations.website_url}
                          </a>
                        </div>
                      )}
                      {deal.contact_person && (
                        <div>
                          <span className="text-muted-foreground">Primary Contact:</span>{' '}
                          {deal.contact_person.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {deal.notes && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Notes</h3>
                    <div className="whitespace-pre-wrap">{deal.notes}</div>
                  </div>
                )}

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Recent Activity</h3>
                  {stageHistory.length > 0 ? (
                    <div className="space-y-2">
                      {stageHistory.slice(0, 3).map((history) => (
                        <div key={history.id} className="text-sm">
                          <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(history.changed_at), { addSuffix: true })}:
                          </span>{' '}
                          Stage changed from{' '}
                          <span className="font-medium">{history.from_stage?.name || 'None'}</span> to{' '}
                          <span className="font-medium">{history.to_stage.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No recent activity</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Add Note</h3>
                  <Textarea
                    placeholder="Type your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="mb-2"
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add Note
                  </Button>
                </div>

                <div className="space-y-4">
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">
                            {note.user?.email || 'User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap">{note.content}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">No notes yet</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-4">
                {deal.contact_person && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-medium mb-2">Primary Contact</h3>
                    <div className="flex items-start">
                      <Avatar className="h-10 w-10 mr-4">
                        <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-lg font-medium">
                          {deal.contact_person.full_name.charAt(0)}
                        </div>
                      </Avatar>
                      <div>
                        <div className="font-medium">{deal.contact_person.full_name}</div>
                        {deal.contact_person.title && (
                          <div className="text-sm text-muted-foreground">{deal.contact_person.title}</div>
                        )}
                        {deal.contact_person.work_email && (
                          <div className="text-sm mt-1">
                            <a
                              href={`mailto:${deal.contact_person.work_email}`}
                              className="text-primary hover:underline"
                            >
                              {deal.contact_person.work_email}
                            </a>
                          </div>
                        )}
                        {deal.contact_person.phone && (
                          <div className="text-sm">
                            <a href={`tel:${deal.contact_person.phone}`} className="text-primary hover:underline">
                              {deal.contact_person.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">
                    Other Contacts at {deal.organizations?.name}
                  </h3>
                  {contactPeople.length > 0 ? (
                    <div className="space-y-4">
                      {contactPeople
                        .filter((person) => person.id !== deal.contact_person_id)
                        .map((person) => (
                          <div key={person.id} className="flex items-start">
                            <Avatar className="h-10 w-10 mr-4">
                              <div className="bg-primary/20 text-primary h-full w-full flex items-center justify-center text-lg font-medium">
                                {person.full_name.charAt(0)}
                              </div>
                            </Avatar>
                            <div>
                              <div className="font-medium">{person.full_name}</div>
                              {person.title && (
                                <div className="text-sm text-muted-foreground">{person.title}</div>
                              )}
                              {person.work_email && (
                                <div className="text-sm mt-1">
                                  <a
                                    href={`mailto:${person.work_email}`}
                                    className="text-primary hover:underline"
                                  >
                                    {person.work_email}
                                  </a>
                                </div>
                              )}
                              {person.phone && (
                                <div className="text-sm">
                                  <a
                                    href={`tel:${person.phone}`}
                                    className="text-primary hover:underline"
                                  >
                                    {person.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No other contacts found
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Stage History</h3>
                  {stageHistory.length > 0 ? (
                    <div className="space-y-4">
                      {stageHistory.map((history) => (
                        <div key={history.id} className="flex items-start">
                          <div className="h-full pt-0.5">
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4 text-primary"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0V5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(history.changed_at), { addSuffix: true })}
                              {history.user?.email && ` by ${history.user.email}`}
                            </div>
                            <div className="mt-1">
                              Stage changed from{' '}
                              <span className="font-medium">{history.from_stage?.name || 'None'}</span> to{' '}
                              <span className="font-medium">{history.to_stage.name}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">No stage change history</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No deal information available
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 