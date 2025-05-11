"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Users, Home, Building2, UserPlus, BarChart3, Settings, Search, UserCircle2, ChevronDown, LogOut, DollarSign } from "lucide-react"
import { contactTypeGroups } from "@/lib/supabase"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // Auto-open dropdown based on current path
  const [openSections, setOpenSections] = useState<string[]>([])
  
  // Check path on load to set initial open sections
  useEffect(() => {
    if (pathname) {
      // Extract contact type from URL if on a type page
      const typeUrlMatch = pathname.match(/\/dashboard\/people\/type\/(.+)/)
      if (typeUrlMatch && typeUrlMatch[1]) {
        const decodedType = decodeURIComponent(typeUrlMatch[1])
        
        // Find which group this type belongs to
        Object.entries(contactTypeGroups).forEach(([group, types]) => {
          if (types.includes(decodedType)) {
            setOpenSections((prev) => 
              prev.includes(group.toLowerCase()) ? prev : [...prev, group.toLowerCase()]
            )
          }
        })
      }
    }
  }, [pathname])

  // Toggle section
  const toggleSection = (section: string) => {
    setOpenSections((prev) => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background shadow-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/images/OC_Logo_Blue.png"
                alt="Outdoorithm Collective"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-xl font-bold text-brand-500">Outdoorithm CRM</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/search"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Search</span>
            </Link>
            <Link
              href="/dashboard/people/new"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden md:inline">Add Contact</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={async () => {
                await supabase.auth.signOut()
                toast({
                  title: "Signed out",
                  description: "You have been successfully signed out."
                })
                window.location.href = "/login"
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-muted/40 hidden md:block overflow-y-auto">
          <div className="flex flex-col gap-1 p-4">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname === "/dashboard" ? "bg-brand-100 text-brand-700" : "text-foreground"
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-medium text-muted-foreground">Contacts</p>
            </div>

            <Link
              href="/dashboard/people"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname === "/dashboard/people" ? "bg-brand-100 text-brand-700" : "text-foreground"
              }`}
            >
              <Users className="h-5 w-5" />
              <span>All Contacts</span>
            </Link>

            {/* Using Accordion component for better dropdown behavior */}
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="w-full"
            >
              {/* Participants Group */}
              <AccordionItem value="participants" className="border-0">
                <AccordionTrigger className="py-2 px-3 hover:bg-brand-100 hover:text-brand-700 rounded-lg hover:no-underline">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5" />
                    <span>Participants</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-0">
                  <div className="pl-10 py-1 bg-background/50 rounded-md">
                    {contactTypeGroups["Participants"].map((type) => (
                      <Link
                        key={type}
                        href={`/dashboard/people/type/${encodeURIComponent(type)}`}
                        className={`block py-1 px-2 text-sm rounded-md hover:bg-brand-50 ${
                          pathname === `/dashboard/people/type/${encodeURIComponent(type)}` 
                            ? "text-brand-700 bg-brand-50" 
                            : "hover:text-brand-700"
                        }`}
                      >
                        {type}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Donors Group */}
              <AccordionItem value="donors" className="border-0">
                <AccordionTrigger className="py-2 px-3 hover:bg-brand-100 hover:text-brand-700 rounded-lg hover:no-underline">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5" />
                    <span>Donors</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-0">
                  <div className="pl-10 py-1 bg-background/50 rounded-md">
                    {contactTypeGroups["Donors"].map((type) => (
                      <Link
                        key={type}
                        href={`/dashboard/people/type/${encodeURIComponent(type)}`}
                        className={`block py-1 px-2 text-sm rounded-md hover:bg-brand-50 ${
                          pathname === `/dashboard/people/type/${encodeURIComponent(type)}` 
                            ? "text-brand-700 bg-brand-50" 
                            : "hover:text-brand-700"
                        }`}
                      >
                        {type}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Partners Group */}
              <AccordionItem value="partners" className="border-0">
                <AccordionTrigger className="py-2 px-3 hover:bg-brand-100 hover:text-brand-700 rounded-lg hover:no-underline">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5" />
                    <span>Partners</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-0">
                  <div className="pl-10 py-1 bg-background/50 rounded-md">
                    {contactTypeGroups["Partners"].map((type) => (
                      <Link
                        key={type}
                        href={`/dashboard/people/type/${encodeURIComponent(type)}`}
                        className={`block py-1 px-2 text-sm rounded-md hover:bg-brand-50 ${
                          pathname === `/dashboard/people/type/${encodeURIComponent(type)}` 
                            ? "text-brand-700 bg-brand-50" 
                            : "hover:text-brand-700"
                        }`}
                      >
                        {type}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Team Group */}
              <AccordionItem value="team" className="border-0">
                <AccordionTrigger className="py-2 px-3 hover:bg-brand-100 hover:text-brand-700 rounded-lg hover:no-underline">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5" />
                    <span>Team</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-0">
                  <div className="pl-10 py-1 bg-background/50 rounded-md">
                    {contactTypeGroups["Team"].map((type) => (
                      <Link
                        key={type}
                        href={`/dashboard/people/type/${encodeURIComponent(type)}`}
                        className={`block py-1 px-2 text-sm rounded-md hover:bg-brand-50 ${
                          pathname === `/dashboard/people/type/${encodeURIComponent(type)}` 
                            ? "text-brand-700 bg-brand-50" 
                            : "hover:text-brand-700"
                        }`}
                      >
                        {type}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Other Group */}
              <AccordionItem value="other" className="border-0">
                <AccordionTrigger className="py-2 px-3 hover:bg-brand-100 hover:text-brand-700 rounded-lg hover:no-underline">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5" />
                    <span>Other</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-0">
                  <div className="pl-10 py-1 bg-background/50 rounded-md">
                    {contactTypeGroups["Other"].map((type) => (
                      <Link
                        key={type}
                        href={`/dashboard/people/type/${encodeURIComponent(type)}`}
                        className={`block py-1 px-2 text-sm rounded-md hover:bg-brand-50 ${
                          pathname === `/dashboard/people/type/${encodeURIComponent(type)}` 
                            ? "text-brand-700 bg-brand-50" 
                            : "hover:text-brand-700"
                        }`}
                      >
                        {type}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Link
              href="/dashboard/people/types"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname === "/dashboard/people/types" ? "text-brand-700" : "text-muted-foreground"
              }`}
            >
              <span className="pl-7">View all contact types...</span>
            </Link>

            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-medium text-muted-foreground">Organizations</p>
            </div>

            <Link
              href="/dashboard/organizations"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname === "/dashboard/organizations" ? "bg-brand-100 text-brand-700" : "text-foreground"
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span>Organizations</span>
            </Link>

            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-medium text-muted-foreground">Fundraising</p>
            </div>

            <Link
              href="/dashboard/fundraising"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname.startsWith("/dashboard/fundraising") ? "bg-brand-100 text-brand-700" : "text-foreground"
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Fundraising Pipelines</span>
            </Link>

            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-medium text-muted-foreground">Analytics</p>
            </div>

            <Link
              href="/dashboard/analytics"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname === "/dashboard/analytics" ? "bg-brand-100 text-brand-700" : "text-foreground"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </Link>

            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-medium text-muted-foreground">Tools</p>
            </div>

            <Link
              href="/dashboard/search"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname === "/dashboard/search" ? "bg-brand-100 text-brand-700" : "text-foreground"
              }`}
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </Link>

            <Link
              href="/dashboard/export"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname === "/dashboard/export" ? "bg-brand-100 text-brand-700" : "text-foreground"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <span>Export</span>
            </Link>

            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-brand-100 hover:text-brand-700 ${
                pathname === "/dashboard/settings" ? "bg-brand-100 text-brand-700" : "text-foreground"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-x-auto">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
