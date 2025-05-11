'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import DealCard from './DealCard';

// Types
type Deal = {
  id: string;
  title: string;
  amount?: number;
  organization_id: string;
  stage_id: string;
  contact_person_id?: string;
  organizations?: {
    name: string;
  };
  contact_person?: {
    full_name: string;
  };
};

type Stage = {
  id: string;
  name: string;
  order: number;
  deals: Deal[];
};

type Pipeline = {
  id: string;
  name: string;
  stages: Stage[];
};

export default function KanbanWithDetails() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch pipeline data
  useEffect(() => {
    async function fetchPipeline() {
      try {
        console.log('[KanbanWithDetails] Starting to fetch pipeline data...');
        setIsLoading(true);
        
        // Get the first pipeline
        const { data: pipelineData, error: pipelineError } = await supabase
          .from('fundraising_pipelines')
          .select('id, name')
          .order('created_at')
          .limit(1)
          .single();
        
        if (pipelineError) throw pipelineError;
        if (!pipelineData) throw new Error('No fundraising pipeline found');
        
        // Get all stages for this pipeline
        const { data: stagesData, error: stagesError } = await supabase
          .from('pipeline_stages')
          .select('id, name, order')
          .eq('pipeline_id', pipelineData.id)
          .order('order');
        
        if (stagesError) throw stagesError;
        
        // Get all deals
        const { data: dealsData, error: dealsError } = await supabase
          .from('fundraising_deals')
          .select(`
            id, 
            title, 
            amount, 
            organization_id,
            organizations (id, name), 
            stage_id,
            contact_person_id,
            contact_person:people!fundraising_deals_contact_person_id_fkey (
              id, full_name
            )
          `)
          .eq('pipeline_id', pipelineData.id);
        
        if (dealsError) throw dealsError;
        
        // Create the pipeline structure with stages and deals
        const stagesWithDeals = stagesData.map(stage => ({
          ...stage,
          deals: dealsData
            .filter(deal => deal.stage_id === stage.id)
            .sort((a, b) => a.title.localeCompare(b.title))
        }));
        
        console.log('[KanbanWithDetails] Successfully fetched and processed pipeline data:', pipelineData, stagesWithDeals);
        setPipeline({
          id: pipelineData.id,
          name: pipelineData.name,
          stages: stagesWithDeals
        });
        
      } catch (error) {
        console.error('[KanbanWithDetails] Error fetching pipeline data:', error);
        setError('Failed to load pipeline data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPipeline();
  }, [supabase]);

  // Handle drag and drop
  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    console.log('[KanbanWithDetails] handleDragEnd triggered:', result);
    
    // Dropped outside the list
    if (!destination) return;
    
    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    
    if (!pipeline) return;
    
    // Create a new pipeline object with updated stage
    const updatedPipeline = { ...pipeline };
    
    // Find source and destination stages
    const sourceStage = updatedPipeline.stages.find(
      stage => stage.id === source.droppableId
    );
    const destStage = updatedPipeline.stages.find(
      stage => stage.id === destination.droppableId
    );
    
    if (!sourceStage || !destStage) return;
    
    // Find the deal being moved
    const deal = sourceStage.deals.find(deal => deal.id === draggableId);
    if (!deal) return;
    
    // Remove from source
    sourceStage.deals = sourceStage.deals.filter(deal => deal.id !== draggableId);
    
    // Add to destination
    destStage.deals.splice(destination.index, 0, deal);
    
    // Update state immediately for UI responsiveness
    setPipeline(updatedPipeline);
    
    try {
      // Update the database
      const { error } = await supabase
        .from('fundraising_deals')
        .update({ stage_id: destStage.id })
        .eq('id', draggableId);
      
      if (error) throw error;
    } catch (error) {
      console.error('[KanbanWithDetails] Error updating deal stage:', error);
      // You could revert the state here if needed
    }
  };

  console.log('[KanbanWithDetails] Rendering component. isLoading:', isLoading, 'error:', error, 'pipeline:', pipeline);

  if (isLoading) {
    console.log('[KanbanWithDetails] Rendering Loading State');
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.log('[KanbanWithDetails] Rendering Error State:', error);
    return (
      <div className="p-4 text-center text-red-500">{error}</div>
    );
  }

  if (!pipeline) {
    console.log('[KanbanWithDetails] Rendering No Pipeline State');
    return (
      <div className="p-4 text-center">No pipeline found</div>
    );
  }

  console.log('[KanbanWithDetails] Rendering Pipeline. Number of stages:', pipeline.stages.length);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">{pipeline.name}</h1>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {pipeline.stages.map(stage => {
            console.log('[KanbanWithDetails] Rendering stage:', stage.name, 'Number of deals:', stage.deals.length);
            return (
              <Card key={stage.id} className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {stage.name} ({stage.deals.length})
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-grow overflow-y-auto pt-0">
                  <Droppable droppableId={stage.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[200px]"
                      >
                        {stage.deals.map((deal, index) => {
                          console.log('[KanbanWithDetails] Mapping DealCard for deal:', deal.id, 'in stage:', stage.name);
                          return (
                            <Draggable
                              key={deal.id}
                              draggableId={deal.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                  }}
                                  className="mb-2"
                                >
                                  <DealCard deal={deal} />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
} 