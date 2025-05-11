"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { contactTypeGroups } from "@/lib/supabase"

interface ContactTypeSelectorProps {
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
}

export function ContactTypeSelector({
  value,
  onChange,
  placeholder = "Select contact type...",
}: ContactTypeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter contact types based on search term
  const filteredGroups = Object.entries(contactTypeGroups)
    .map(([group, types]) => ({
      group,
      types: types.filter((type) => type.toLowerCase().includes(searchTerm.toLowerCase())),
    }))
    .filter((group) => group.types.length > 0)

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        {value ? value : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="p-2">
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Search contact types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-auto p-1">
            {filteredGroups.map(({ group, types }) => (
              <div key={group}>
                <div className="px-2 py-1.5 text-xs font-semibold">{group}</div>
                {types.map((type) => (
                  <div
                    key={type}
                    className={cn(
                      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent",
                      value === type && "bg-accent",
                    )}
                    onClick={() => {
                      onChange(type)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === type ? "opacity-100" : "opacity-0")} />
                    {type}
                  </div>
                ))}
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">No contact type found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
