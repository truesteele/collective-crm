import { PersonForm } from "../person-form"

export default function NewPersonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add New Person</h2>
        <p className="text-muted-foreground">Add a new person to the Outdoorithm Collective database</p>
      </div>

      <PersonForm />
    </div>
  )
}
