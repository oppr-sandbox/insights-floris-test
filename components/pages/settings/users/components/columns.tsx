import { ColumnDef } from "@tanstack/react-table"
import { User } from "../data/schema"
import { DataTableColumnHeaderSort } from "@/components/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { roles } from "../data/data"
import { UserActions } from "./user-actions"

export const userListColumns: ColumnDef<User>[] = [
    {
        accessorKey: "displayName",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeaderSort column={column} title="Name" />
        ),
        meta: {
            className: 'max-w-xs whitespace-normal'
        },
        cell: ({ row }) => {
            return (
                <span className="flex items-center gap-2">
                    {row.getValue('displayName')}
                    {row.original.isInvited &&
                        <Badge variant="outline">
                            Invited
                        </Badge>}
                </span>
            )
        },
    },
    {
        accessorKey: "email",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeaderSort column={column} title="Email" />
        ),
        cell: ({ row }) => {
            return <span>{row.getValue('email')}</span>
        },
    },
    {
        accessorKey: "position",
        enableHiding: false,
        header: ({ column }) => (
            <DataTableColumnHeaderSort column={column} title="Role" />
        ),
        cell: ({ row }) => {
            const role = roles.find(
                (role) => role.value.toUpperCase() === row.getValue("position")
            )

            if (!role) {
                return null
            }

            return (
                <Badge color={role.color}>{role.value}</Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex justify-end">
                {(row.original.isInvited && row.original.position !== 'OWNER') &&
                    <UserActions user={row.original} />
                }
            </div>
        ),
    },
]