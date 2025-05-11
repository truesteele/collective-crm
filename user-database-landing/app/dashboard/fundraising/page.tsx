"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { FundraisingPipeline, getFundraisingPipelines } from "@/lib/supabase"
import Link from "next/link"

export default function FundraisingPage() {
  const [pipelines, setPipelines] = useState<FundraisingPipeline[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadPipelines() {
      try {
        const data = await getFundraisingPipelines()
        setPipelines(data)
      } catch (error) {
        console.error("Error loading pipelines:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPipelines()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Fundraising Pipelines</h1>
        <Button onClick={() => router.push("/dashboard/fundraising/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Pipeline
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <h3 className="text-xl font-medium text-gray-500 mb-4">No pipelines found</h3>
              <p className="text-gray-400 mb-6">Create your first fundraising pipeline to get started</p>
              <Button onClick={() => router.push("/dashboard/fundraising/new")}>
                <Plus className="mr-2 h-4 w-4" /> Create Pipeline
              </Button>
            </div>
          ) : (
            pipelines.map((pipeline) => (
              <Link
                href={`/dashboard/fundraising/${pipeline.id}`}
                key={pipeline.id}
                className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-bold mb-2">{pipeline.name}</h2>
                <p className="text-sm text-gray-500">Created: {new Date(pipeline.created_at).toLocaleDateString()}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
} 