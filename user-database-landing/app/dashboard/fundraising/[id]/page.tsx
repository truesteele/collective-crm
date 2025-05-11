"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Plus, MoreVertical, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { OrganizationSelector } from "@/components/organization-selector"
import { 
  FundraisingPipeline, 
  PipelineStage, 
  FundraisingDeal, 
  getPipelineById, 
  getPipelineStages, 
  getDealsByPipeline,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  getOrganizationById,
  createDeal,
  updateDeal,
  deleteDeal,
  Organization
} from "@/lib/supabase"
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd"

export default function PipelineView({ params }: { params: { id: string } }) {
  // Using React.use() to properly unwrap params in Next.js
  const unwrappedParams = use(params as any) as { id: string };
  const pipelineId = unwrappedParams.id;

  const [pipeline, setPipeline] = useState<FundraisingPipeline | null>(null)
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<FundraisingDeal[]>([])
  const [organizations, setOrganizations] = useState<Record<string, Organization>>({})
  const [loading, setLoading] = useState(true)
  const [isEditStageDialogOpen, setIsEditStageDialogOpen] = useState(false)
  const [isNewDealDialogOpen, setIsNewDealDialogOpen] = useState(false)
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null)
  const [stageName, setStageName] = useState("")
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("")
  const [dealTitle, setDealTitle] = useState("")
  const [dealAmount, setDealAmount] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const pipelineData = await getPipelineById(pipelineId)
        const stagesData = await getPipelineStages(pipelineId)
        const dealsData = await getDealsByPipeline(pipelineId)

        setPipeline(pipelineData)
        setStages(stagesData)
        setDeals(dealsData)

        // Load organization data for each deal
        const orgMap: Record<string, Organization> = {}
        
        for (const deal of dealsData) {
          if (!orgMap[deal.organization_id]) {
            try {
              const org = await getOrganizationById(deal.organization_id)
              orgMap[deal.organization_id] = org
            } catch (error) {
              console.error(`Error fetching org ${deal.organization_id}:`, error)
            }
          }
        }
        
        setOrganizations(orgMap)
      } catch (error) {
        console.error("Error loading pipeline data:", error)
        toast({
          title: "Error",
          description: "Failed to load pipeline data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [pipelineId])

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    // Dropped outside a droppable area
    if (!destination) return

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return

    // Get the deal that was dragged
    const dealId = draggableId
    const deal = deals.find(d => d.id === dealId)
    
    if (!deal) return

    try {
      // Update the deal with the new stage ID
      const updatedDeal = await updateDeal(dealId, {
        stage_id: destination.droppableId
      })

      // Update the local state
      setDeals(prev => 
        prev.map(d => d.id === dealId ? { ...d, stage_id: destination.droppableId } : d)
      )

      toast({
        title: "Success",
        description: "Deal moved successfully"
      })
    } catch (error) {
      console.error("Error updating deal stage:", error)
      toast({
        title: "Error",
        description: "Failed to move deal",
        variant: "destructive"
      })
    }
  }

  const handleAddStage = async () => {
    if (!stageName.trim()) {
      toast({
        title: "Error",
        description: "Stage name is required",
        variant: "destructive"
      })
      return
    }

    try {
      const newStage = await createPipelineStage({
        pipeline_id: pipelineId,
        name: stageName,
        order: stages.length
      })

      setStages([...stages, newStage])
      setStageName("")
      setIsEditStageDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Stage added successfully"
      })
    } catch (error) {
      console.error("Error adding stage:", error)
      toast({
        title: "Error",
        description: "Failed to add stage",
        variant: "destructive"
      })
    }
  }

  const handleUpdateStage = async () => {
    if (!activeStage) return
    
    if (!stageName.trim()) {
      toast({
        title: "Error",
        description: "Stage name is required",
        variant: "destructive"
      })
      return
    }

    try {
      const updatedStage = await updatePipelineStage(activeStage.id, {
        name: stageName
      })

      setStages(prev => 
        prev.map(s => s.id === activeStage.id ? updatedStage : s)
      )
      
      setIsEditStageDialogOpen(false)
      toast({
        title: "Success",
        description: "Stage updated successfully"
      })
    } catch (error) {
      console.error("Error updating stage:", error)
      toast({
        title: "Error",
        description: "Failed to update stage",
        variant: "destructive"
      })
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    // Check if there are deals in this stage
    const hasDeals = deals.some(deal => deal.stage_id === stageId)
    
    if (hasDeals) {
      toast({
        title: "Cannot Delete",
        description: "This stage contains deals. Move or delete them first.",
        variant: "destructive"
      })
      return
    }

    try {
      await deletePipelineStage(stageId)
      setStages(prev => prev.filter(s => s.id !== stageId))
      
      toast({
        title: "Success",
        description: "Stage deleted successfully"
      })
    } catch (error) {
      console.error("Error deleting stage:", error)
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive"
      })
    }
  }

  const handleAddDeal = async (stageId: string) => {
    if (!dealTitle.trim() || !selectedOrganizationId) {
      toast({
        title: "Error",
        description: "Deal title and organization are required",
        variant: "destructive"
      })
      return
    }

    try {
      const newDeal = await createDeal({
        title: dealTitle,
        organization_id: selectedOrganizationId,
        pipeline_id: pipelineId,
        stage_id: stageId,
        amount: dealAmount ? parseFloat(dealAmount) : null,
        contact_person_id: null,
        notes: null
      })

      // Fetch the organization details
      const org = await getOrganizationById(selectedOrganizationId)
      
      // Update local state
      setDeals([...deals, newDeal])
      setOrganizations(prev => ({
        ...prev,
        [selectedOrganizationId]: org
      }))
      
      // Reset form
      setDealTitle("")
      setSelectedOrganizationId("")
      setDealAmount("")
      setIsNewDealDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Deal added successfully"
      })
    } catch (error) {
      console.error("Error adding deal:", error)
      toast({
        title: "Error",
        description: "Failed to add deal",
        variant: "destructive"
      })
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await deleteDeal(dealId)
      setDeals(prev => prev.filter(d => d.id !== dealId))
      
      toast({
        title: "Success",
        description: "Deal deleted successfully"
      })
    } catch (error) {
      console.error("Error deleting deal:", error)
      toast({
        title: "Error",
        description: "Failed to delete deal",
        variant: "destructive"
      })
    }
  }

  const getDealsForStage = (stageId: string) => {
    return deals.filter(deal => deal.stage_id === stageId)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-500 mb-4">Pipeline not found</h3>
          <Button onClick={() => router.push("/dashboard/fundraising")}>
            Back to Pipelines
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/dashboard/fundraising" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Pipelines
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{pipeline.name}</h1>
        <Button variant="outline" onClick={() => {
          setActiveStage(null)
          setStageName("")
          setIsEditStageDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Stage
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
          {stages.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-72">
              <div className="bg-gray-100 rounded-lg h-full">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-medium text-gray-800">{stage.name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setActiveStage(stage)
                        setStageName(stage.name)
                        setIsEditStageDialogOpen(true)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteStage(stage.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="p-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-gray-500 hover:text-gray-800"
                    onClick={() => {
                      setDealTitle("")
                      setSelectedOrganizationId("")
                      setDealAmount("")
                      setActiveStage(stage)
                      setIsNewDealDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Deal
                  </Button>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="px-2 pb-2 min-h-[calc(70vh-140px)]"
                    >
                      {getDealsForStage(stage.id).map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-3 rounded-md shadow-sm mb-2 border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
                              onClick={(e) => {
                                // Only navigate if it's a direct click on the card and not a drag operation
                                // Check if the mouse has moved significantly during click (drag)
                                if (e.detail === 1) { // Only single clicks, not double-clicks
                                  // Add a small delay to distinguish between click and drag start
                                  setTimeout(() => {
                                    console.log('🔥 DEAL CARD CLICKED:', deal.id);
                                    window.location.href = `/dashboard/fundraising/deals/${deal.id}`;
                                  }, 150);
                                }
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-sm">{deal.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {organizations[deal.organization_id]?.name || 'Unknown Organization'}
                                  </p>
                                  {deal.amount && (
                                    <p className="text-sm font-medium text-green-600 mt-2">
                                      ${deal.amount.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        // Prevent the parent's click handler from firing
                                        e.stopPropagation();
                                      }}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDeal(deal.id);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Edit Stage Dialog */}
      <Dialog open={isEditStageDialogOpen} onOpenChange={setIsEditStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeStage ? "Edit Stage" : "Add New Stage"}</DialogTitle>
            <DialogDescription>
              {activeStage 
                ? "Update the details of this pipeline stage." 
                : "Create a new stage for your fundraising pipeline."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stageName">Stage Name</Label>
              <Input
                id="stageName"
                placeholder="e.g., Initial Contact, Proposal, Closing"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditStageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={activeStage ? handleUpdateStage : handleAddStage}
            >
              {activeStage ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Deal Dialog */}
      <Dialog open={isNewDealDialogOpen} onOpenChange={setIsNewDealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>
              Create a new fundraising deal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dealTitle">Deal Title</Label>
              <Input
                id="dealTitle"
                placeholder="e.g., Annual Grant 2023"
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization</Label>
              <OrganizationSelector 
                value={selectedOrganizationId} 
                onChange={setSelectedOrganizationId} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealAmount">Amount ($)</Label>
              <Input
                id="dealAmount"
                type="number"
                placeholder="e.g., 10000"
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsNewDealDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={() => activeStage && handleAddDeal(activeStage.id)}
            >
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 