"use client"

import * as React from "react"
import { getRoleBadgeClass } from "@/lib/role-colors"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { authApi } from "@/lib/api"
import { User } from "@/context/AuthContext"
import { EditUserSheet } from "@/components/edit-user-sheet"

import { userSchema, type UserData } from "@/lib/types"


export function UserDataTable({
  data: initialData,
  onUserUpdated
}: { data: UserData[], onUserUpdated?: () => void }) {
  const [data, setData] = React.useState<UserData[]>(initialData)
  
  // Update local state if props change
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Edit Sheet State
  const [editingUser, setEditingUser] = React.useState<UserData | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  const handleDelete = async (netId: string) => {
    if (confirm(`Are you sure you want to delete user ${netId}?`)) {
        try {
            await authApi.delete(`/auth/users/${netId}`)
            toast.success(`User ${netId} deleted`)
            if (onUserUpdated) onUserUpdated()
        } catch (error) {
            console.error("Failed to delete user", error)
            toast.error("Failed to delete user")
        }
    }
  }

  const columns = React.useMemo<ColumnDef<UserData>[]>(() => [
    {
        accessorKey: "netId",
        header: "NetID",
        cell: ({ row }) => <div className="font-medium">{row.getValue("netId")}</div>,
    },
    {
        accessorKey: "name",
        header: "Name",
        accessorFn: (row) => `${row.fName} ${row.lName}`,
        cell: ({ row }) => {
        return <TableCellViewer item={row.original} />
        },
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const role = (row.getValue("role") as string).toLowerCase();
            return (
                <Badge className={`${getRoleBadgeClass(role)} border font-medium capitalize`} variant="outline">
                    {role}
                </Badge>
            )
        },
        enableSorting: true,
    },
    {
        id: "actions",
        cell: ({ row }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
            >
                <IconDotsVertical className="size-4" />
                <span className="sr-only">Open menu</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => {
                setEditingUser(row.original)
                setIsEditOpen(true)
            }}>
                Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                variant="destructive"
                onClick={() => handleDelete(row.original.netId)}
            >
                Delete User
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        ),
    },
  ], [])
  
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.netId,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
            <Input
            placeholder="Filter by NetID..."
            value={(table.getColumn("netId")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("netId")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
            />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <IconLayoutColumns className="mr-2 size-4" />
                Columns
                <IconChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                                )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row: any) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell: any) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
        
        <EditUserSheet 
            open={isEditOpen} 
            onOpenChange={setIsEditOpen} 
            user={editingUser} 
            onUserUpdated={() => {
                if (onUserUpdated) onUserUpdated()
            }}
        />
    </div>
  )
}

// Chart Constants
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--primary))", // use CSS variable for coloring 
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: UserData }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left underline-offset-4 hover:underline">
          {item.fName} {item.lName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.fName} {item.lName}</DrawerTitle>
          <DrawerDescription className="flex items-center gap-2">
            NetID: {item.netId} ·{" "}
            <Badge className={`${getRoleBadgeClass(item.role)} border font-medium capitalize`} variant="outline">
              {item.role}
            </Badge>
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm h-[80vh]">
            <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">User Details</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fname" className="text-right"> First Name </Label>
                        <Input id="fname" value={item.fName} className="col-span-3" readOnly />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lname" className="text-right"> Last Name </Label>
                        <Input id="lname" value={item.lName} className="col-span-3" readOnly />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right"> Email </Label>
                        <Input id="email" value={item.email} className="col-span-3" readOnly />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right"> Role </Label>
                        <div className="col-span-3">
                          <Badge className={`${getRoleBadgeClass(item.role)} border font-medium capitalize`} variant="outline">
                            {item.role}
                          </Badge>
                        </div>
                    </div>
                 </div>
            </TabsContent>
            <TabsContent value="activity">
                 <div className="rounded-md border p-4 mt-4">
                    <h3 className="mb-4 font-semibold leading-none tracking-tight">Login Activity</h3>
                    
                    {/* Placeholder Chart */}
                    <ChartContainer config={chartConfig}>
                        <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 0,
                            right: 0,
                        }}
                        >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                            hide
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                            dataKey="desktop"
                            type="natural"
                            fill="var(--color-desktop)"
                            fillOpacity={0.4}
                            stroke="var(--color-desktop)"
                            stackId="a"
                        />
                        </AreaChart>
                    </ChartContainer>
                 </div>
            </TabsContent>
            </Tabs>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
