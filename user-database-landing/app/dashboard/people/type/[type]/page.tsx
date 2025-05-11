import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus } from "lucide-react"
import { getPeopleByType } from "@/lib/supabase"
import { PeopleDataTable } from "../../data-table"

// Define params interface for better type safety
interface ContactTypeParams {
  params: {
    type: string;
  };
}

export default async function ContactTypePage({ params }: ContactTypeParams) {
  if (!params || !params.type) {
    return notFound();
  }
  
  // Safely decode the type parameter
  const decodedType = decodeURIComponent(params.type);

  try {
    // Get people of this type using mock data if needed
    const people = await getPeopleByType(decodedType);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{decodedType}s</h2>
            <p className="text-muted-foreground">Manage your {decodedType.toLowerCase()} contacts</p>
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
            <CardTitle>{decodedType} Directory</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/export?type=${encodeURIComponent(decodedType)}`}>Export</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PeopleDataTable data={people} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading contact type page:", error);
    return notFound();
  }
}
