"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { type Person, createPerson, updatePerson } from "@/lib/supabase"
import { ContactTypeSelector } from "@/components/contact-type-selector"

const personSchema = z.object({
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  primary_contact_type: z.string().nullable(),
  secondary_contact_type: z.string().nullable(),
  work_email: z.string().email().optional().nullable(),
  personal_email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  linkedin_profile: z.string().url().optional().nullable(),
  title: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  location_name: z.string().optional().nullable(),
  num_followers: z.number().int().nonnegative().optional().nullable(),
  pipedrive_id: z.number().int().nonnegative().optional().nullable(),
  organization_id: z.string().optional().nullable(),
})

type PersonFormValues = z.infer<typeof personSchema>

export function PersonForm({ person }: { person?: Person }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues: Partial<PersonFormValues> = {
    full_name: person?.full_name || "",
    primary_contact_type: person?.primary_contact_type || null,
    secondary_contact_type: person?.secondary_contact_type || null,
    work_email: person?.work_email || null,
    personal_email: person?.personal_email || null,
    phone: person?.phone || null,
    linkedin_profile: person?.linkedin_profile || null,
    title: person?.title || null,
    headline: person?.headline || null,
    summary: person?.summary || null,
    notes: person?.notes || null,
    location_name: person?.location_name || null,
    num_followers: person?.num_followers || null,
    pipedrive_id: person?.pipedrive_id || null,
    organization_id: person?.organization_id || null,
  }

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues,
  })

  async function onSubmit(values: PersonFormValues) {
    try {
      setIsSubmitting(true)

      if (person) {
        // Update existing person
        await updatePerson(person.id, values)
        toast({
          title: "Contact updated",
          description: `${values.full_name} has been updated successfully.`,
        })
        router.push(`/dashboard/people/${person.id}`)
      } else {
        // Create new person
        const newPerson = await createPerson(values as any)
        toast({
          title: "Contact created",
          description: `${values.full_name} has been added to the database.`,
        })
        router.push(`/dashboard/people/${newPerson.id}`)
      }

      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "There was a problem saving the contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="primary_contact_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact Type</FormLabel>
                    <FormControl>
                      <ContactTypeSelector
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select primary contact type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_contact_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Contact Type</FormLabel>
                    <FormControl>
                      <ContactTypeSelector
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select secondary contact type (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="CEO" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco, CA" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input placeholder="CEO & Founder at Company" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="work_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@company.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personal_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedin_profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/johndoe" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="num_followers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Followers</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number.parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pipedrive_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pipedrive ID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="12345"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number.parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="organization_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Organization ID" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Professional summary or bio"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this contact"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : person ? "Update Contact" : "Add Contact"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
