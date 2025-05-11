import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus } from "lucide-react"
import { getPeople } from "@/lib/supabase"
import { PeopleDataTable } from "./data-table"

export default async function PeoplePage() {
  const people = await getPeople()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Contacts</h2>
          <p className="text-muted-foreground">Manage your professional network</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/people/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contact Directory</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/export">Export</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PeopleDataTable data={people} />
        </CardContent>
      </Card>
    </div>
  )
}
