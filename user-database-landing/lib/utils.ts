import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string, relative = false): string {
  const date = new Date(dateString)

  if (relative) {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "just now"
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`
    }

    const diffInYears = Math.floor(diffInDays / 365)
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date)
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function getInitials(name: string): string {
  if (!name) return ""

  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function getContactTypeColor(type: string | null): string {
  if (!type) return "bg-gray-200 text-gray-800"

  // Group contact types by category for consistent coloring
  const participantTypes = ["Participant", "Prospective Participant"]
  const donorTypes = [
    "Individual Donor",
    "Prospective Individual Donor",
    "Institutional Donor",
    "Prospective Institutional Donor",
  ]
  const partnerTypes = [
    "Product Partner",
    "Prospective Product Partner",
    "Program Partner",
    "Prospective Program Partner",
    "Corporate Partner",
    "Prospective Corporate Partner",
  ]
  const teamTypes = ["Board", "Staff", "Advisor", "Volunteer"]
  const otherTypes = ["Influencer", "Media Contact", "Vendor"]

  // Assign colors based on category
  if (participantTypes.includes(type)) {
    return type.startsWith("Prospective") ? "bg-brand-50 text-brand-600" : "bg-brand-100 text-brand-700"
  }

  if (donorTypes.includes(type)) {
    return type.startsWith("Prospective") ? "bg-forest-light/50 text-forest-dark" : "bg-forest-light text-forest-dark"
  }

  if (partnerTypes.includes(type)) {
    return type.startsWith("Prospective") ? "bg-brand-200/50 text-brand-800" : "bg-brand-200 text-brand-800"
  }

  if (teamTypes.includes(type)) {
    return "bg-earth-light text-earth-dark"
  }

  if (otherTypes.includes(type)) {
    return "bg-brand-100/70 text-brand-700"
  }

  return "bg-gray-100 text-gray-800"
}

export function isProspectiveType(type: string | null): boolean {
  if (!type) return false
  return type.startsWith("Prospective")
}

export function getBaseContactType(type: string | null): string {
  if (!type) return "Unknown"
  return type.replace("Prospective ", "")
}
