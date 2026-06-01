import { DataTableColumnHeader, DataTableColumnHeaderSort } from "@/components/data-table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table"

export type ActiveUsersData = {
    id: string;
    displayName: string;
    email: string;
    position: string;
    discipline?: string;
    location?: string;
};

export const usersColumns: ColumnDef<ActiveUsersData>[] = [
    {
        id: "select",
        meta: {
            className: 'w-12'
        },
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => {
                    row.toggleSelected(!!value);
                }}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "displayName",
        enableHiding: false,
        header: ({ column }) => (
            <DataTableColumnHeaderSort column={column} title="Display Name" />
        ),
        meta: {
            className: 'max-w-xs whitespace-normal'
        },
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="text-base font-semibold">{row.original.displayName}</span>
                    <span className="text-sm text-muted-foreground">{row.original.email}</span>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "position",
        enableHiding: false,
        header: ({ column }) => (
            <DataTableColumnHeaderSort column={column} title="Position" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="text-base">{row.original.position}</span>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "discipline",
        enableHiding: false,
        header: ({ column }) => (
            <DataTableColumnHeaderSort column={column} title="Discipline" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="text-base">{row.original.discipline ?? '-'}</span>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "location",
        enableHiding: false,
        header: ({ column }) => (
            <DataTableColumnHeaderSort column={column} title="Location" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="text-base">{row.original.location ?? '-'}</span>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
]