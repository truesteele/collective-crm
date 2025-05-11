import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, ExternalLink, MapPin, Calendar, Clock, Building2, Users } from "lucide-react"
import { getOrganizationById, getPeopleByOrganization } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"

export default async function OrganizationDetailPage({ params }: { params: { id: string } }) {
  // Special case: if the ID is "new", redirect to the new organization page
  if (params.id === "new") {
    redirect("/dashboard/organizations/new")
  }

  try {
    const organization = await getOrganizationById(params.id)
    const associatedPeople = await getPeopleByOrganization(params.id)

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-brand-700">{organization.name}</h2>
            {organization.industry && (
              <p className="text-muted-foreground">{organization.industry}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="border-brand-200 text-brand-700 hover:bg-brand-50">
              <Link href={`/dashboard/organizations/${organization.id}/people`}>
                <Users className="mr-2 h-4 w-4" />
                View People
              </Link>
            </Button>
            <Button asChild className="bg-brand-500 hover:bg-brand-600">
              <Link href={`/dashboard/organizations/${organization.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-brand-100">
            <CardHeader>
              <CardTitle className="text-brand-700">Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {organization.website_url && (
                <div className="flex items-start gap-2">
                  <ExternalLink className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Website</p>
                    <p className="text-sm text-muted-foreground">
                      <a
                        href={organization.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {organization.website_url}
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {organization.industry && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Industry</p>
                    <p className="text-sm text-muted-foreground">{organization.industry}</p>
                  </div>
                </div>
              )}

              {organization.primary_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{organization.primary_address}</p>
                  </div>
                </div>
              )}

              {organization.locality && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{organization.locality}</p>
                  </div>
                </div>
              )}

              {organization.incorporation_type && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Incorporation Type</p>
                    <p className="text-sm text-muted-foreground">{organization.incorporation_type}</p>
                  </div>
                </div>
              )}

              {organization.organization_type && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Organization Type</p>
                    <p className="text-sm text-muted-foreground">{organization.organization_type}</p>
                  </div>
                </div>
              )}

              {organization.employee_count && (
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Employee Count</p>
                    <p className="text-sm text-muted-foreground">{organization.employee_count}</p>
                  </div>
                </div>
              )}

              {organization.size_range && (
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Size Range</p>
                    <p className="text-sm text-muted-foreground">{organization.size_range}</p>
                  </div>
                </div>
              )}

              {organization.founded && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Founded</p>
                    <p className="text-sm text-muted-foreground">{organization.founded}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-brand-100">
            <CardHeader>
              <CardTitle className="text-brand-700">Associated Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {associatedPeople.length > 0 ? (
                <div className="space-y-3">
                  {associatedPeople.map((person) => (
                    <div key={person.id} className="flex items-center justify-between border-b border-brand-100 pb-2 last:border-0">
                      <div>
                        <Link 
                          href={`/dashboard/people/${person.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {person.full_name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{person.title || ""}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild
                        className="text-brand-500 hover:text-brand-700 hover:bg-brand-50"
                      >
                        <Link href={`/dashboard/people/${person.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No associated contacts found</p>
              )}
              
              <div className="mt-4 text-center">
                <Button asChild variant="outline" size="sm" className="border-brand-200 text-brand-700 hover:bg-brand-50">
                  <Link href="/dashboard/people/new">
                    <Users className="mr-2 h-4 w-4" />
                    Add New Contact
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {organization.pipedrive_org_id && (
          <Card className="border-brand-100">
            <CardHeader>
              <CardTitle className="text-brand-700">Integration Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-brand-500 mt-0.5"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
                </svg>
                <div>
                  <p className="font-medium">Pipedrive Organization ID</p>
                  <p className="text-sm text-muted-foreground">{organization.pipedrive_org_id}</p>
                </div>
              </div>

              {organization.last_pipedrive_sync && (
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-brand-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Last Synced with Pipedrive</p>
                    <p className="text-sm text-muted-foreground">{formatDate(organization.last_pipedrive_sync)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-brand-100">
          <CardHeader>
            <CardTitle className="text-brand-700">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-brand-500 mt-0.5" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(organization.created_at)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-brand-500 mt-0.5" />
              <div>
                <p className="font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">{formatDate(organization.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error loading organization:", error)
    return notFound()
  }
} 