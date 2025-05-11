import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export type Person = {
  id: string
  organization_id: string | null
  full_name: string
  primary_contact_type: string | null
  secondary_contact_type: string | null
  pipedrive_id: number | null
  work_email: string | null
  personal_email: string | null
  phone: string | null
  linkedin_profile: string | null
  notes: string | null
  title: string | null
  num_followers: number | null
  headline: string | null
  summary: string | null
  location_name: string | null
  created_at: string
  updated_at: string
}

export type Organization = {
  id: string
  name: string
  website_url: string | null
  industry: string | null
  pipedrive_org_id: number | null
  normalized_domain: string | null
  funding_program_url: string | null
  organization_type: string | null
  linkedin_url: string | null
  ein_number: string | null
  primary_address: string | null
  employee_count: number | null
  locality: string | null
  incorporation_type: string | null
  size_range: string | null
  founded: number | null
  created_at: string
  updated_at: string
  last_pipedrive_sync: string | null
}

// Updated contact types based on the provided list
export const contactTypes = [
  "Participant",
  "Prospective Participant",
  "Individual Donor",
  "Prospective Individual Donor",
  "Institutional Donor",
  "Prospective Institutional Donor",
  "Product Partner",
  "Prospective Product Partner",
  "Program Partner",
  "Prospective Program Partner",
  "Corporate Partner",
  "Prospective Corporate Partner",
  "Influencer",
  "Media Contact",
  "Volunteer",
  "Advisor",
  "Board",
  "Staff",
  "Vendor",
]

// Group contact types by category for better organization
export const contactTypeGroups = {
  Participants: ["Participant", "Prospective Participant"],
  Donors: [
    "Individual Donor",
    "Prospective Individual Donor",
    "Institutional Donor",
    "Prospective Institutional Donor",
  ],
  Partners: [
    "Product Partner",
    "Prospective Product Partner",
    "Program Partner",
    "Prospective Program Partner",
    "Corporate Partner",
    "Prospective Corporate Partner",
  ],
  Team: ["Board", "Staff", "Advisor", "Volunteer"],
  Other: ["Influencer", "Media Contact", "Vendor"],
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Mock data for development
// const mockPeople: Person[] = [ ... ]; // Removed mock data array

// Wrapper for getPeople function to use mock data if needed -> Refactored to throw errors
export async function getPeople() {
  const { data, error } = await supabase.from("people").select("*").order("full_name")

  if (error) {
    console.error("Error fetching people:", error)
    throw error // Throw error instead of returning mock data
  }

  return data as Person[] || [] // Return data or empty array if null
}

// Improved getPeopleByType function with mock data fallback -> Refactored to throw errors
export async function getPeopleByType(contactType: string) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("primary_contact_type", contactType)
    .order("full_name")

  if (error) {
    console.error(`Error fetching people by type ${contactType}:`, error)
    throw error // Throw error instead of returning mock data
  }

  return data as Person[] || [] // Return data or empty array if null
}

export async function getPeopleByTypeGroup(types: string[]) {
  const { data, error } = await supabase.from("people").select("*").in("primary_contact_type", types).order("full_name")

  if (error) {
    console.error("Error fetching people by type group:", error)
    throw error
  }

  return data as Person[]
}

export async function getPeopleByOrganization(organizationId: string) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("organization_id", organizationId)
    .order("full_name")

  if (error) {
    console.error("Error fetching people by organization:", error)
    throw error
  }

  return data as Person[]
}

// Improved getPersonById function with mock data fallback -> Refactored to throw errors
export async function getPersonById(id: string) {
  const { data, error } = await supabase.from("people").select("*").eq("id", id).single()

  if (error) {
    // Handle cases like 'PGRST116' (JSON object requested, multiple (or no) rows returned)
    // which might indicate the ID doesn't exist.
    console.error(`Error fetching person by ID ${id}:`, error)
    throw error // Throw error instead of returning mock data or searching mock data
  }

  // No need to check if mockPerson exists, just return data
  return data as Person;
}

export async function getOrganizations() {
  const { data, error } = await supabase.from("organizations").select("*").order("name")

  if (error) {
    console.error("Error fetching organizations:", error)
    throw error
  }

  return data as Organization[]
}

export async function getOrganizationById(id: string) {
  const { data, error } = await supabase.from("organizations").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching organization:", error)
    throw error
  }

  return data as Organization
}

export async function createPerson(person: Omit<Person, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("people").insert([person]).select()

  if (error) {
    console.error("Error creating person:", error)
    throw error
  }

  return data[0] as Person
}

export async function updatePerson(id: string, person: Partial<Omit<Person, "id" | "created_at" | "updated_at">>) {
  const { data, error } = await supabase.from("people").update(person).eq("id", id).select()

  if (error) {
    console.error("Error updating person:", error)
    throw error
  }

  return data[0] as Person
}

export async function deletePerson(id: string) {
  const { error } = await supabase.from("people").delete().eq("id", id)

  if (error) {
    console.error("Error deleting person:", error)
    throw error
  }

  return true
}

// Wrapper for getContactTypeCounts function to use mock data if needed -> Refactored to throw errors
export async function getContactTypeCounts() {
  const { data, error } = await supabase.from("people").select("primary_contact_type")

  if (error) {
    console.error("Error fetching contact type counts:", error)
    throw error // Throw error instead of using mock data
  }

  const counts: Record<string, number> = {}
  (data || []).forEach((person) => { // Handle potential null data
    const type = person.primary_contact_type || "Uncategorized"
    counts[type] = (counts[type] || 0) + 1
  })

  return counts
}

// Wrapper for getRecentlyUpdatedPeople function to use mock data if needed -> Refactored to throw errors
export async function getRecentlyUpdatedPeople(limit = 5) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching recently updated people:", error)
    throw error // Throw error instead of using mock data
  }

  return data as Person[] || [] // Return data or empty array if null
}

export async function searchPeople(query: string) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .or(
      `full_name.ilike.%${query}%,work_email.ilike.%${query}%,personal_email.ilike.%${query}%,title.ilike.%${query}%,headline.ilike.%${query}%,location_name.ilike.%${query}%,notes.ilike.%${query}%`,
    )
    .order("full_name")

  if (error) {
    console.error("Error searching people:", error)
    throw error
  }

  return data as Person[]
}
