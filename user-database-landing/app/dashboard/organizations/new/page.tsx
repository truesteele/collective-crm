import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard/organizations"
              className="text-brand-600 hover:text-brand-800 flex items-center text-sm mb-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Organizations
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-brand-700">New Organization</h2>
          <p className="text-muted-foreground">
            Create a new organization record
          </p>
        </div>
      </div>

      <Card className="border-brand-100">
        <CardHeader>
          <CardTitle className="text-brand-700">Organization Information</CardTitle>
          <CardDescription>
            This feature is coming soon. For now, please use the bi-directional sync with Pipedrive to create organizations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex justify-center">
          <Button asChild className="bg-brand-500 hover:bg-brand-600">
            <Link href="/dashboard/organizations">
              Return to Organizations
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 