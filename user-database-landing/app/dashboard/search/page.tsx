"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus } from "lucide-react"
import { searchPeople, type Person } from "@/lib/supabase"
import { getContactTypeColor, truncateText } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Person[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const data = await searchPeople(query)
      setResults(data)
      setHasSearched(true)
    } catch (error) {
      console.error("Error searching:", error)
      toast({
        title: "Search failed",
        description: "There was a problem performing your search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Search</h2>
          <p className="text-muted-foreground">Find contacts in your network</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/people/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, title, location, or notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {hasSearched && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">
                {results.length} {results.length === 1 ? "result" : "results"} found
              </h3>
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((person) => (
                    <div key={person.id} className="border rounded-md p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/people/${person.id}`} className="font-medium hover:underline">
                              {person.full_name}
                            </Link>
                            {person.primary_contact_type && (
                              <Badge
                                variant="outline"
                                className={`${getContactTypeColor(person.primary_contact_type)} font-normal`}
                              >
                                {person.primary_contact_type}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {person.title || ""} {person.title && person.location_name ? "•" : ""}{" "}
                            {person.location_name || ""}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/people/${person.id}`}>View Profile</Link>
                        </Button>
                      </div>
                      {person.summary && (
                        <p className="mt-2 text-sm text-muted-foreground">{truncateText(person.summary, 150)}</p>
                      )}
                      {person.notes && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Notes:</p>
                          <p className="text-sm text-muted-foreground">{truncateText(person.notes, 100)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No results found. Try a different search term.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
