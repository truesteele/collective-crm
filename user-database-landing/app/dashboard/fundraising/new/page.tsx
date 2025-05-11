"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { createPipeline, createPipelineStage, defaultPipelineStages } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export default function NewPipelinePage() {
  const [pipelineName, setPipelineName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pipelineName.trim()) {
      toast({
        title: "Error",
        description: "Pipeline name is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create new pipeline
      const newPipeline = await createPipeline({
        name: pipelineName,
      })

      // Create default stages for the pipeline
      for (let i = 0; i < defaultPipelineStages.length; i++) {
        await createPipelineStage({
          pipeline_id: newPipeline.id,
          name: defaultPipelineStages[i],
          order: i,
        })
      }

      toast({
        title: "Success",
        description: "Pipeline created successfully",
      })

      // Redirect to the pipeline view
      router.push(`/dashboard/fundraising/${newPipeline.id}`)
    } catch (error) {
      console.error("Error creating pipeline:", error)
      toast({
        title: "Error",
        description: "Failed to create pipeline. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/dashboard/fundraising" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Pipelines
        </Link>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Fundraising Pipeline</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pipeline Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Institutional Fundraising, Individual Giving"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  required
                />
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Default Pipeline Stages</h3>
                <p className="text-sm text-gray-500 mb-4">
                  The following stages will be created by default. You can modify them later.
                </p>
                <div className="space-y-2">
                  {defaultPipelineStages.map((stage, index) => (
                    <div key={index} className="px-3 py-2 bg-gray-50 rounded-md text-sm">
                      {stage}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.push("/dashboard/fundraising")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Pipeline"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 