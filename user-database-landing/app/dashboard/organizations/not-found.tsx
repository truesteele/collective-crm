import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function OrganizationNotFound() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-brand-700">
          Organization Not Found
        </h1>
        <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          The organization you are looking for does not exist or has been removed.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild className="bg-brand-500 hover:bg-brand-600">
          <Link href="/dashboard/organizations">
            View All Organizations
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-brand-200 text-brand-700 hover:bg-brand-50">
          <Link href="/dashboard/organizations/new">
            Create New Organization
          </Link>
        </Button>
      </div>
    </div>
  )
} 