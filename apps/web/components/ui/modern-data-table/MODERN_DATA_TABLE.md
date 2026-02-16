# ModernDataTable Component

A clean, reusable table component with consistent styling across the application.

## Features

- ✅ Clean card-based layout
- ✅ Flexible filter controls slot
- ✅ Built-in column visibility toggle
- ✅ Custom empty states
- ✅ Equal column spacing (no explicit sizes)
- ✅ No row selection checkboxes
- ✅ No density toggle
- ✅ Responsive design

## Basic Usage

```tsx
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<YourDataType>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  // ... more columns
];

function YourPage() {
  const data = useYourData();

  return (
    <ModernDataTable
      columns={columns}
      data={data}
      title="Your Data"
      description="Manage your data"
    />
  );
}
```

## With Search and Filters

```tsx
function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const allData = useContacts();

  // Filter data in parent component
  const filteredData = useMemo(() => {
    let filtered = allData;

    // Apply filters
    if (typeFilter !== "all") {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [allData, typeFilter, searchQuery]);

  return (
    <ModernDataTable
      columns={columns}
      data={filteredData}
      title="Contacts"
      description={`${filteredData.length} of ${allData.length} contacts`}
      filterControls={
        <>
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] md:flex-initial md:w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="type1">Type 1</SelectItem>
              <SelectItem value="type2">Type 2</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
```

## With Custom Empty State

```tsx
<ModernDataTable
  columns={columns}
  data={filteredData}
  title="Orders"
  emptyState={
    <div className="rounded-lg border border-dashed p-12 text-center">
      <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your first order to get started.
      </p>
      <Button asChild className="mt-6">
        <Link href="/admin/orders/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Link>
      </Button>
    </div>
  }
/>
```

## With Header Actions

```tsx
<ModernDataTable
  columns={columns}
  data={data}
  title="Invoices"
  headerActions={
    <>
      <Button variant="outline" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button asChild>
        <Link href="/admin/invoices/new">
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Link>
      </Button>
    </>
  }
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | Required | Table column definitions |
| `data` | `TData[]` | Required | Data to display (pre-filtered) |
| `title` | `ReactNode` | - | Card title |
| `description` | `ReactNode` | - | Card description |
| `filterControls` | `ReactNode` | - | Custom filter controls (search, dropdowns, etc.) |
| `headerActions` | `ReactNode` | - | Action buttons for the header |
| `emptyState` | `ReactNode` | Default message | Custom empty state component |
| `isLoading` | `boolean` | `false` | Loading state |
| `showColumnVisibility` | `boolean` | `true` | Show/hide column visibility toggle |
| `onTableReady` | `(table: Table<TData>) => void` | - | Callback when table instance is ready |

## Column Definitions

### Best Practices

1. **Don't specify column sizes** - Let columns distribute evenly
2. **Use enableSorting sparingly** - Only enable for key columns
3. **Make actions column non-hideable** - `enableHiding: false`
4. **Use compact cell designs** - Stack related info vertically

### Example Column Definition

```tsx
export const contactsTableColumns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Client",
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }) => {
      const client = row.original;
      return (
        <Link href={`/admin/contacts/${client.id}`} className="flex flex-col gap-0.5">
          <span className="font-medium">{client.name}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => <Badge>{row.original.type}</Badge>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ActionsDropdown data={row.original} />,
  },
];
```

## Migration from Old DataTable

### Before (Manual Card + DataTable)

```tsx
<Card>
  <CardHeader>
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle>All Clients</CardTitle>
        <CardDescription>Manage your clients</CardDescription>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Search..." />
        <Select>{/* filters */}</Select>
        <ColumnVisibilityDropdown table={table} />
      </div>
    </div>
  </CardHeader>
  <CardContent>
    {filteredData.length === 0 ? (
      <EmptyState />
    ) : (
      <DataTable columns={columns} data={filteredData} />
    )}
  </CardContent>
</Card>
```

### After (ModernDataTable)

```tsx
<ModernDataTable
  columns={columns}
  data={filteredData}
  title="All Clients"
  description="Manage your clients"
  filterControls={
    <>
      <Input placeholder="Search..." />
      <Select>{/* filters */}</Select>
    </>
  }
  emptyState={<EmptyState />}
/>
```

## Notes

- **Data filtering happens in parent component** - Pass pre-filtered data to the table
- **Column visibility is automatic** - Toggle appears automatically if columns are hideable
- **Empty states are conditional** - Provide custom empty states for better UX
- **Responsive by default** - Works on mobile, tablet, and desktop
- **Equal column spacing** - Don't use `size` property on columns
