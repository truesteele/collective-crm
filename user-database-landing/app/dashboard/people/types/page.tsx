import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCircle2 } from "lucide-react"
import { getContactTypeCounts, contactTypeGroups } from "@/lib/supabase"

export default async function ContactTypesPage() {
  const contactTypeCounts = await getContactTypeCounts()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-brand-700">Contact Types</h2>
        <p className="text-muted-foreground">Browse contacts by relationship type</p>
      </div>

      {Object.entries(contactTypeGroups).map(([groupName, types]) => (
        <div key={groupName} className="space-y-4">
          <h3 className="text-xl font-semibold text-brand-600">{groupName}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {types.map((type) => (
              <Card key={type} className="border-brand-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">{type}</CardTitle>
                  <UserCircle2 className="h-4 w-4 text-brand-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contactTypeCounts[type] || 0}</div>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-muted-foreground">Contacts in this category</p>
                    <Button size="sm" asChild className="bg-brand-500 hover:bg-brand-600">
                      <Link href={`/dashboard/people/type/${encodeURIComponent(type)}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
