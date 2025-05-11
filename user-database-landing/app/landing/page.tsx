import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Building2, BarChart3, ArrowRight, ChevronRight, Database, Filter, Search, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-brand-50">
      {/* Header */}
      <header className="py-6 px-4 md:px-6 lg:px-8 border-b border-brand-100">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/images/OC_Logo_Blue.png"
              alt="Outdoorithm Collective Logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="text-xl font-bold text-brand-700">Collective CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="text-brand-600 hover:text-brand-700 hover:bg-brand-50">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild className="bg-brand-500 hover:bg-brand-600">
              <Link href="/dashboard/people/new">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-800 leading-tight">
                Build Stronger Outdoor Industry Relationships
              </h1>
              <p className="text-xl text-brand-600 max-w-md">
                The modern CRM designed specifically for the outdoor industry's unique network and relationship needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild className="bg-brand-500 hover:bg-brand-600">
                  <Link href="/dashboard">
                    Access Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="border-brand-200 text-brand-700 hover:bg-brand-50">
                  <Link href="/dashboard/people">
                    Browse Contacts
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-brand-200/50">
              <Image
                src="/placeholder.jpg"
                alt="Dashboard preview"
                width={800}
                height={600}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-800/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-800 mb-4">Powerful CRM Features</h2>
            <p className="text-xl text-brand-600 max-w-2xl mx-auto">
              Everything you need to manage and grow your outdoor industry network
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-brand-100 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle className="text-brand-700">Contact Management</CardTitle>
                <CardDescription>
                  Organize all your industry contacts in one easy-to-use system with custom categorization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Comprehensive contact profiles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Custom contact types and categorization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Relationship history tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-brand-100 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle className="text-brand-700">Advanced Search</CardTitle>
                <CardDescription>
                  Find exactly who you're looking for with powerful search and filtering capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Full-text search across all contact data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Filter by contact type, organization, or attributes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Save frequent searches for quick access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-brand-100 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle className="text-brand-700">Network Analytics</CardTitle>
                <CardDescription>
                  Gain insights into your professional network with detailed analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Visualize network composition</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Track relationship growth over time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Identify key connections and influencers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-brand-100 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle className="text-brand-700">Data Integration</CardTitle>
                <CardDescription>
                  Seamlessly integrate with your existing tools and data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Import from spreadsheets and other CRMs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Export data in multiple formats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>API access for custom integrations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-brand-100 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle className="text-brand-700">Organization Tracking</CardTitle>
                <CardDescription>
                  Keep track of industry organizations and their key personnel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Organization profiles and hierarchies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Link contacts to their organizations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Industry-specific organization types</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-brand-100 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle className="text-brand-700">Data Security</CardTitle>
                <CardDescription>
                  Keep your valuable network data secure and protected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>End-to-end encryption</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Role-based access controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-brand-500" />
                    <span>Regular automated backups</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-r from-brand-500 to-brand-600 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to elevate your outdoor industry relationships?</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Start managing your professional network more effectively today
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" asChild className="bg-white text-brand-700 hover:bg-gray-100">
              <Link href="/dashboard">
                Access Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-brand-600">
              <Link href="/dashboard/people/new">
                Add Your First Contact
                <UserPlus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 lg:px-8 bg-brand-800 text-brand-100">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image
                src="/images/OC_Logo_Blue.png"
                alt="Outdoorithm Collective Logo"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span className="text-lg font-medium text-white">Outdoorithm Collective CRM</span>
            </div>
            <div className="flex gap-6">
              <Link href="/dashboard" className="text-brand-200 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/dashboard/people" className="text-brand-200 hover:text-white transition-colors">Contacts</Link>
              <Link href="/dashboard/search" className="text-brand-200 hover:text-white transition-colors">Search</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-brand-700 text-sm text-brand-300 text-center">
            © {new Date().getFullYear()} Outdoorithm Collective. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
} 