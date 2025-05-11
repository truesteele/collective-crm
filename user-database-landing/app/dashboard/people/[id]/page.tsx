import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Mail, Phone, Linkedin, MapPin, Calendar, Clock, Building2 } from "lucide-react"
import { getPersonById } from "@/lib/supabase"
import { formatDate, getContactTypeColor } from "@/lib/utils"

export default async function PersonDetailPage({ params }: { params: { id: string } }) {
  // Special case: if the ID is "new", redirect to the new person page
  if (params.id === "new") {
    redirect("/dashboard/people/new")
  }

  try {
    const person = await getPersonById(params.id)
    const contactTypeColor = getContactTypeColor(person.primary_contact_type)

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-brand-700">{person.full_name}</h2>
              {person.primary_contact_type && (
                <Badge variant="outline" className={`${contactTypeColor} font-normal`}>
                  {person.primary_contact_type}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {person.title || "No title"} {person.headline ? `• ${person.headline}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="border-brand-200 text-brand-700 hover:bg-brand-50">
              <Link href={`/dashboard/people/${person.id}/activity`}>
                <Clock className="mr-2 h-4 w-4" />
                Activity
              </Link>
            </Button>
            <Button asChild className="bg-brand-500 hover:bg-brand-600">
              <Link href={`/dashboard/people/${person.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-brand-100">
            <CardHeader>
              <CardTitle className="text-brand-700">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {person.work_email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-brand-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Work Email</p>
                      <p className="text-sm text-muted-foreground">{person.work_email}</p>
                    </div>
                  </div>
                )}

                {person.personal_email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-brand-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Personal Email</p>
                      <p className="text-sm text-muted-foreground">{person.personal_email}</p>
                    </div>
                  </div>
                )}

                {person.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-brand-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{person.phone}</p>
                    </div>
                  </div>
                )}

                {person.linkedin_profile && (
                  <div className="flex items-start gap-2">
                    <Linkedin className="h-5 w-5 text-brand-500 mt-0.5" />
                    <div>
                      <p className="font-medium">LinkedIn</p>
                      <p className="text-sm text-muted-foreground">
                        <a
                          href={person.linkedin_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          View Profile
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {person.location_name && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-brand-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{person.location_name}</p>
                    </div>
                  </div>
                )}

                {person.organization_id && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-5 w-5 text-brand-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Organization</p>
                      <p className="text-sm text-muted-foreground">
                        <Link
                          href={`/dashboard/organizations/${person.organization_id}`}
                          className="text-brand-600 hover:underline"
                        >
                          View Organization
                        </Link>
                      </p>
                    </div>
                  </div>
                )}

                {person.primary_contact_type && (
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <div>
                      <p className="font-medium">Contact Type</p>
                      <p className="text-sm text-muted-foreground">{person.primary_contact_type}</p>
                    </div>
                  </div>
                )}

                {person.secondary_contact_type && (
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <div>
                      <p className="font-medium">Secondary Type</p>
                      <p className="text-sm text-muted-foreground">{person.secondary_contact_type}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-100">
            <CardHeader>
              <CardTitle className="text-brand-700">Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {person.title && (
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
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  <div>
                    <p className="font-medium">Title</p>
                    <p className="text-sm text-muted-foreground">{person.title}</p>
                  </div>
                </div>
              )}

              {person.headline && (
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
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <line x1="3" x2="21" y1="9" y2="9"></line>
                    <line x1="9" x2="9" y1="21" y2="9"></line>
                  </svg>
                  <div>
                    <p className="font-medium">Headline</p>
                    <p className="text-sm text-muted-foreground">{person.headline}</p>
                  </div>
                </div>
              )}

              {person.num_followers !== null && (
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <div>
                    <p className="font-medium">LinkedIn Followers</p>
                    <p className="text-sm text-muted-foreground">{person.num_followers}</p>
                  </div>
                </div>
              )}

              {person.pipedrive_id && (
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
                    <p className="font-medium">Pipedrive ID</p>
                    <p className="text-sm text-muted-foreground">{person.pipedrive_id}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {person.summary && (
          <Card className="border-brand-100">
            <CardHeader>
              <CardTitle className="text-brand-700">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{person.summary}</p>
            </CardContent>
          </Card>
        )}

        {person.notes && (
          <Card className="border-brand-100">
            <CardHeader>
              <CardTitle className="text-brand-700">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{person.notes}</p>
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
                <p className="text-sm text-muted-foreground">{formatDate(person.created_at)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-brand-500 mt-0.5" />
              <div>
                <p className="font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">{formatDate(person.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    return notFound()
  }
}
