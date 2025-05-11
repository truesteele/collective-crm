import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Users, UserPlus, Building2, Clock, BarChart3, Briefcase } from "lucide-react"
import { getPeople, getContactTypeCounts, getRecentlyUpdatedPeople } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"

export default async function DashboardPage() {
  const people = await getPeople()
  const contactTypeCounts = await getContactTypeCounts()
  const recentlyUpdated = await getRecentlyUpdatedPeople(5)

  // Get the top 5 contact types by count
  const topContactTypes = Object.entries(contactTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-brand-700">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to the Outdoorithm Collective CRM</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/search">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 h-4 w-4"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              Search
            </Link>
          </Button>
          <Button asChild className="bg-brand-500 hover:bg-brand-600">
            <Link href="/dashboard/people/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-brand-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{people.length}</div>
            <p className="text-xs text-muted-foreground">People in your network</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Influencers</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-brand-500"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path>
              <rect width="18" height="18" x="3" y="4" rx="2"></rect>
              <circle cx="12" cy="10" r="2"></circle>
              <line x1="8" x2="8" y1="2" y2="4"></line>
              <line x1="16" x2="16" y1="2" y2="4"></line>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactTypeCounts["Influencer"] || 0}</div>
            <p className="text-xs text-muted-foreground">Influencers in your network</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Board Members</CardTitle>
            <Briefcase className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactTypeCounts["Board Member"] || 0}</div>
            <p className="text-xs text-muted-foreground">Board members in your network</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentlyUpdated.length}</div>
            <p className="text-xs text-muted-foreground">Contacts updated recently</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-5 border-brand-100">
          <CardHeader>
            <CardTitle className="text-brand-700">Recently Updated Contacts</CardTitle>
            <CardDescription>Contacts with recent activity or updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentlyUpdated.map((person) => (
                <div key={person.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{person.full_name}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{person.title || "No title"}</span>
                      {person.primary_contact_type && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">
                            {person.primary_contact_type}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Updated {formatDate(person.updated_at, true)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-brand-500 hover:text-brand-700 hover:bg-brand-50"
                  >
                    <Link href={`/dashboard/people/${person.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full border-brand-200 text-brand-700 hover:bg-brand-50">
              <Link href="/dashboard/people">View All Contacts</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 border-brand-100">
          <CardHeader>
            <CardTitle className="text-brand-700">Contact Types</CardTitle>
            <CardDescription>Breakdown by relationship type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContactTypes.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{type}</p>
                    <p className="text-xs text-muted-foreground">{count} contacts</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-brand-500 hover:text-brand-700 hover:bg-brand-50"
                  >
                    <Link href={`/dashboard/people/type/${encodeURIComponent(type)}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full border-brand-200 text-brand-700 hover:bg-brand-50">
              <Link href="/dashboard/people/types">View All Types</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2 border-brand-100">
          <CardHeader>
            <CardTitle className="text-brand-700">Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your network</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button className="justify-start bg-brand-500 hover:bg-brand-600" asChild>
              <Link href="/dashboard/people/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Contact
              </Link>
            </Button>
            <Button className="justify-start bg-brand-500 hover:bg-brand-600" asChild>
              <Link href="/dashboard/search">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                Search Contacts
              </Link>
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              asChild
              className="border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <Link href="/dashboard/people">
                <Users className="mr-2 h-4 w-4" />
                View All Contacts
              </Link>
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              asChild
              className="border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <Link href="/dashboard/organizations">
                <Building2 className="mr-2 h-4 w-4" />
                View Organizations
              </Link>
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              asChild
              className="border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <Link href="/dashboard/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              asChild
              className="border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <Link href="/dashboard/export">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Export Data
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-brand-100">
          <CardHeader>
            <CardTitle className="text-brand-700">Network Growth</CardTitle>
            <CardDescription>New contacts over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <Image
                src="/images/OC_Logo_Blue.png"
                alt="Outdoorithm Collective"
                width={80}
                height={80}
                className="mx-auto opacity-30"
              />
              <p className="mt-4 text-muted-foreground text-sm">Growth chart will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
