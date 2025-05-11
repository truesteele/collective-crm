"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, Trash2, ExternalLink, ChevronRight, ChevronsLeft, ChevronsRight, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { type Person, deletePerson, contactTypeGroups } from "@/lib/supabase"
import { getContactTypeColor, isProspectiveType } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const columns: ColumnDef<Person>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "full_name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-brand-700">{row.getValue("full_name")}</div>
        <div className="text-xs text-muted-foreground">{row.original.headline || ""}</div>
      </div>
    ),
  },
  {
    accessorKey: "primary_contact_type",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Contact Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const type = row.getValue("primary_contact_type") as string | null
      if (!type) return <div>-</div>

      const colorClass = getContactTypeColor(type)
      const isProspective = isProspectiveType(type)

      return (
        <Badge variant="outline" className={`${colorClass} font-normal ${isProspective ? "border-dashed" : ""}`}>
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <div>{row.getValue("title") || "-"}</div>,
  },
  {
    accessorKey: "work_email",
    header: "Email",
    cell: ({ row }) => {
      const workEmail = row.getValue("work_email") as string | null
      const personalEmail = row.original.personal_email

      return (
        <div>
          {workEmail ? (
            <div className="text-sm">{workEmail}</div>
          ) : personalEmail ? (
            <div className="text-sm">
              {personalEmail} <span className="text-xs text-muted-foreground">(personal)</span>
            </div>
          ) : (
            "-"
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "location_name",
    header: "Location",
    cell: ({ row }) => <div>{row.getValue("location_name") || "-"}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell person={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
]

// Separate component for the action cell to manage its own state
function ActionCell({ person }: { person: Person }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/people/${person.id}`} className="text-brand-700">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/people/${person.id}/edit`} className="text-brand-700">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          {person.linkedin_profile && (
            <DropdownMenuItem asChild>
              <a href={person.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-brand-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect width="4" height="12" x="2" y="9"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                LinkedIn Profile
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DeletePersonMenuItem personId={person.id} personName={person.full_name} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function DeletePersonMenuItem({ personId, personName }: { personId: string; personName: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deletePerson(personId)
      toast({
        title: "Contact deleted",
        description: `${personName} has been removed from the database.`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            setIsOpen(true)
          }}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {personName} from the database. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function PeopleDataTable({ data }: { data: Person[] }) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [typeFilterOpen, setTypeFilterOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Function to filter by contact type
  const filterByType = (type: string) => {
    table.getColumn("primary_contact_type")?.setFilterValue(type)
    setSelectedType(type)
    setTypeFilterOpen(false)
  }

  // Function to clear filter
  const clearTypeFilter = () => {
    table.getColumn("primary_contact_type")?.setFilterValue(null)
    setSelectedType(null)
    setTypeFilterOpen(false)
  }

  // Function to handle row click and navigate to person details
  const handleRowClick = (personId: string) => {
    router.push(`/dashboard/people/${personId}`)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("full_name")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />

          {/* Simple dropdown for contact type filtering */}
          <div className="relative">
            <Button
              variant="outline"
              className="ml-auto border-brand-200 text-brand-700"
              onClick={() => setTypeFilterOpen(!typeFilterOpen)}
            >
              {selectedType || "Contact Type"} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>

            {typeFilterOpen && (
              <div className="absolute z-10 mt-1 w-56 rounded-md border bg-popover shadow-lg">
                <div className="p-1">
                  <button
                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent"
                    onClick={clearTypeFilter}
                  >
                    All Types
                  </button>

                  <div className="my-1 h-px bg-muted"></div>

                  {Object.entries(contactTypeGroups).map(([groupName, types]) => (
                    <div key={groupName}>
                      <div className="px-2 py-1.5 text-xs font-semibold">{groupName}</div>
                      {types.map((type) => (
                        <button
                          key={type}
                          className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent"
                          onClick={() => filterByType(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simple dropdown for column visibility */}
        <div className="relative">
          <Button
            variant="outline"
            className="border-brand-200 text-brand-700"
            onClick={() => setColumnsOpen(!columnsOpen)}
          >
            Columns <ChevronDown className="ml-2 h-4 w-4" />
          </Button>

          {columnsOpen && (
            <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border bg-popover shadow-lg">
              <div className="p-1">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <div key={column.id} className="flex items-center px-2 py-1.5 text-sm">
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          id={`column-${column.id}`}
                          className="mr-2"
                        />
                        <label htmlFor={`column-${column.id}`} className="capitalize cursor-pointer flex-1">
                          {column.id}
                        </label>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-md border border-brand-100">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-brand-50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  data-state={row.getIsSelected() && "selected"} 
                  className="hover:bg-brand-100/30 cursor-pointer transition-colors active:bg-brand-100/70 group relative"
                  onClick={(e) => {
                    // Avoid navigating when clicking on checkboxes or action buttons
                    if (
                      e.target instanceof HTMLElement && 
                      (e.target.closest('[role="checkbox"]') || 
                       e.target.closest('.actions-cell') || 
                       e.target.closest('button'))
                    ) {
                      return
                    }
                    handleRowClick(row.original.id)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className={`${cell.column.id === 'actions' ? 'actions-cell' : ''} ${
                        cell.column.id !== 'select' && cell.column.id !== 'actions' ? 'group-hover:text-brand-700' : ''
                      } ${cell.column.id === 'full_name' ? 'relative' : ''}`}
                    >
                      {cell.column.id === 'full_name' && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      )}
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
            selected.
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="border-brand-200 text-brand-700 px-2"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-brand-200 text-brand-700"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-brand-200 text-brand-700"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="border-brand-200 text-brand-700 px-2"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Click outside handler */}
      {(typeFilterOpen || columnsOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setTypeFilterOpen(false)
            setColumnsOpen(false)
          }}
        />
      )}
    </div>
  )
}
