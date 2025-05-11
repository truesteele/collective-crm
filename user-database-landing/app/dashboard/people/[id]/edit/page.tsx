import { notFound, redirect } from "next/navigation"
import { PersonForm } from "../../person-form"
import { getPersonById } from "@/lib/supabase"

export default async function EditPersonPage({ params }: { params: { id: string } }) {
  // Special case: if the ID is "new", redirect to the new person page
  if (params.id === "new") {
    redirect("/dashboard/people/new")
  }

  try {
    const person = await getPersonById(params.id)

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Person</h2>
          <p className="text-muted-foreground">Update information for {person.full_name}</p>
        </div>

        <PersonForm person={person} />
      </div>
    )
  } catch (error) {
    return notFound()
  }
}
