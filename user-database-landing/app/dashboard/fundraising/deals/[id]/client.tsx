'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';

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

export function ClientDealDetails({ id }: { id: string }) {
  const [deal, setDeal] = useState<FundraisingDeal | null>(null);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [contactPeople, setContactPeople] = useState<Person[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const router = useRouter();
  const dealId = id;
  
  // Fetch deal details
  useEffect(() => {
    if (!dealId) {
      setError('No deal ID provided');
      setIsLoading(false);
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
        if (!dealData) throw new Error('Deal not found');
        
        setDeal(dealData as unknown as FundraisingDeal);

        // Fix the notes query - remove the user join since it's causing issues
        try {
          const { data: notesData, error: notesError } = await supabase
            .from('deal_notes')
            .select(`
              id, 
              content, 
              created_at, 
              created_by
            `)
            .eq('deal_id', dealId)
            .order('created_at', { ascending: false });

          if (notesError) throw notesError;
          
          // TypeScript may complain, but this will work at runtime
          setNotes(notesData || []);
        } catch (noteError) {
          console.error('Error fetching notes:', noteError);
          // Don't fail the whole page load for notes error
          setNotes([]);
        }

        // Fix the stage history query - remove the user join since it's causing issues
        try {
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
              changed_by
            `)
            .eq('deal_id', dealId)
            .order('changed_at', { ascending: false });

          if (historyError) throw historyError;
          
          // TypeScript may complain, but this will work at runtime
          setStageHistory(historyData as unknown as StageHistory[]);
        } catch (historyError) {
          console.error('Error fetching stage history:', historyError);
          // Don't fail the whole page load for history error
          setStageHistory([]);
        }

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
      } catch (error: any) {
        console.error('Error fetching deal details:', error);
        setError(error.message || 'Failed to load deal details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDealDetails();
  }, [dealId]);

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
        setNotes([data[0] as unknown as DealNote, ...notes]);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-4">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Deal not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/fundraising">Fundraising</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Deal Details</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">{deal.title}</CardTitle>
            {deal.amount && (
              <Badge variant="outline" className="ml-4 text-lg font-normal">
                {formatCurrency(deal.amount)}
              </Badge>
            )}
          </div>
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <div>
              Organization: <span className="font-medium text-foreground">{deal.organizations?.name}</span>
            </div>
            <div className="mx-2">•</div>
            <div>
              Stage: <span className="font-medium text-foreground">{deal.pipeline_stages?.name}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
              </CardContent>
            </Card>
          </div>

          {deal.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{deal.notes}</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Note</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="space-y-4">
            {notes.length > 0 ? (
              notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">
                        {note.user?.email || 'User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap">{note.content}</div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">No notes yet</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          {deal.contact_person && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Primary Contact</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Other Contacts at {deal.organizations?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stage History</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 