"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Search } from "lucide-react"
import { searchPeople, type Person } from "@/lib/supabase"
import { getContactTypeColor, truncateText } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Person[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Use debounce to avoid excessive API calls
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(debounceTimer);
  }, [query]);

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
          <h2 className="text-3xl font-bold tracking-tight text-brand-700">People Directory</h2>
          <p className="text-muted-foreground">Find contacts in your network</p>
        </div>
        <Button asChild className="bg-brand-500 hover:bg-brand-600">
          <Link href="/dashboard/people/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </div>

      <Card className="border-brand-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-brand-700 flex items-center">
            <Search className="h-5 w-5 mr-2 text-brand-500" />
            Find People
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Search by name, email, title, location, or notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            {isSearching && (
              <div className="absolute right-3 top-3 text-sm text-muted-foreground animate-pulse">
                Searching...
              </div>
            )}
          </div>

          {(hasSearched || query.trim()) && (
            <div className="mt-6">
              {results.length > 0 && (
                <div className="text-sm text-muted-foreground mb-4">
                  Found {results.length} {results.length === 1 ? "person" : "people"}
                </div>
              )}
              
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((person) => (
                    <Link 
                      href={`/dashboard/people/${person.id}`} 
                      key={person.id} 
                      className="block border border-brand-100 rounded-md p-4 hover:bg-brand-50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-brand-700 hover:underline">
                              {person.full_name}
                            </span>
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
                      </div>
                      {person.summary && (
                        <p className="mt-2 text-sm text-muted-foreground">{truncateText(person.summary, 150)}</p>
                      )}
                      {person.notes && !person.summary && (
                        <p className="mt-2 text-sm text-muted-foreground">{truncateText(person.notes, 100)}</p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                query.trim() && !isSearching && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No results found. Try a different search term.</p>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
