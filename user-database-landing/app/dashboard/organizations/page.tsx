import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Plus, ExternalLink } from "lucide-react"
import { getOrganizations } from "@/lib/supabase"

export default async function OrganizationsPage() {
  const organizations = await getOrganizations()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-brand-700">Organizations</h2>
          <p className="text-muted-foreground">
            Manage and view all organizations in your network
          </p>
        </div>
        <Button asChild className="bg-brand-500 hover:bg-brand-600">
          <Link href="/dashboard/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org.id} className="border-brand-100 hover:border-brand-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-brand-700">
                <Link 
                  href={`/dashboard/organizations/${org.id}`}
                  className="hover:text-brand-500 transition-colors flex items-center"
                >
                  <Building2 className="h-5 w-5 mr-2 inline-block" />
                  {org.name}
                </Link>
              </CardTitle>
              {org.industry && (
                <CardDescription className="text-sm text-brand-500">
                  {org.industry}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {org.website && (
                <p className="text-sm flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 text-brand-400" />
                  <a 
                    href={org.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline truncate"
                  >
                    {org.website}
                  </a>
                </p>
              )}
              <Link 
                href={`/dashboard/organizations/${org.id}`}
                className="text-brand-600 hover:underline text-sm inline-block mt-2"
              >
                View details →
              </Link>
            </CardContent>
          </Card>
        ))}

        {organizations.length === 0 && (
          <Card className="col-span-full border-dashed border-brand-200 bg-brand-50/50">
            <CardHeader>
              <CardTitle className="text-center text-brand-700">No Organizations Found</CardTitle>
              <CardDescription className="text-center">
                Get started by creating your first organization
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button asChild className="bg-brand-500 hover:bg-brand-600">
                <Link href="/dashboard/organizations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Organization
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 