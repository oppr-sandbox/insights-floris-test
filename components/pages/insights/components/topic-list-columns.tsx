"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeaderSort } from "@/components/data-table/data-table-column-header"
import { CompletedTopic } from "../data/schema"
import { statuses } from "../../topics/data/data"
import { Badge } from "@/components/ui/badge"
import { TopicStatus } from "../../topics/data/schema"

export const columns: ColumnDef<CompletedTopic>[] = [
  {
    accessorKey: "title",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Topic" />
    ),
    meta: {
      className: 'max-w-xs whitespace-normal'
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col space-y-1">
          <div className="text-xs text-muted-foreground">Topic ID: {row.original.topicCode}</div>
          <div className="font-medium">{row.original.topicName}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "initiatedBy",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Initiated By" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 items-center">
          <div className="flex flex-col">
            <span className="text-xs font-semibold">{row.original.initiatedBy}</span>
            <span className="text-xs text-muted-foreground">{row.original.initiatedByRole}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "participation",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Participation" />
    ),
    cell: ({ row }) => {

      const data = row.original;

      return (
        <div className="flex flex-col space-y-1">
          <div className="flex space-x-1 items-center">
            <p className="text-xs">
              {data.feedbacksCount} feedback(s) from {data.respondentsCount} participants(s)
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses[row.getValue("status") as TopicStatus]

      if (!status) {
        return null
      }

      return (
        <Badge variant="outline" color={status.color}>{status.value}</Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
]