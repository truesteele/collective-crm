import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPeople, getContactTypeCounts } from "@/lib/supabase"

export default async function AnalyticsPage() {
  const people = await getPeople()
  const contactTypeCounts = await getContactTypeCounts()

  // Sort contact types by count (descending)
  const sortedContactTypes = Object.entries(contactTypeCounts).sort((a, b) => b[1] - a[1])

  // Calculate total contacts
  const totalContacts = people.length

  // Calculate percentages for each contact type
  const contactTypePercentages = sortedContactTypes.map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / totalContacts) * 100),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Insights about your professional network</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Type Distribution</CardTitle>
          <CardDescription>Breakdown of your network by relationship type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactTypePercentages.map(({ type, count, percentage }) => (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{type}</span>
                  <span className="text-sm text-muted-foreground">
                    {count} contacts ({percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Location Distribution</CardTitle>
            <CardDescription>Where your contacts are located</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Location chart will appear here</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Growth</CardTitle>
            <CardDescription>How your network has grown over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Growth chart will appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
