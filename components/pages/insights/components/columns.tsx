"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeaderSort } from "@/components/data-table/data-table-column-header"

import { Insight, PublishedInsight } from "../data/schema"
import { statuses } from "../data/data"
import { formatDate } from "@/utils/helpers/helpers"
import { ItemActions } from "./item-actions"

export const allInsightsColumns: ColumnDef<Insight>[] = [
  {
    accessorKey: "insightCode",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Insight ID" />
    ),
    meta: {
      className: 'max-w-xs whitespace-normal'
    },
    cell: ({ row }) => {
      return <span>{row.getValue('insightCode')}</span>
    },
  },
  {
    accessorKey: "title",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Topic ID/Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col space-y-1">
          <div className="text-xs text-muted-foreground">
            Topic ID: {row.original.topicCode}
          </div>
          <div className="font-medium">
            {row.original.topicName}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "feedbackCount",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="	Feedback Count" />
    ),
    cell: ({ row }) => {
      return <span>{row.getValue('feedbackCount')}</span>
    },
  },
  {
    accessorKey: "createdBy",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Created By" />
    ),
    cell: ({ row }) => {
      return <span>{row.getValue('createdBy')}</span>
    }
  },
  {
    accessorKey: "createdOn",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Created On" />
    ),
    cell: ({ row }) => {
      return <span>{formatDate(row.getValue('createdOn'))}</span>
    }
  },
  {
    accessorKey: "status",
    enableHiding: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses[row.original.status]

      if (!status) {
        return null
      }

      return (
        <Badge color={status.color}>{status.value}</Badge>
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
        <ItemActions insight={row.original} />
      </div>
    ),
  },
]


export const publishedInsightsColumns: ColumnDef<PublishedInsight>[] = [
  {
    accessorKey: "insightCode",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Insight ID" />
    ),
    meta: {
      className: 'max-w-xs whitespace-normal'
    },
    cell: ({ row }) => {
      return <span>{row.getValue('insightCode')}</span>
    },
  },
  {
    accessorKey: "title",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Topic ID/Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col space-y-1">
          <div className="text-xs text-muted-foreground">
            Topic ID: {row.original.topicCode}
          </div>
          <div className="font-medium">
            {row.original.topicName}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "publishedDate",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Published Date" />
    ),
    cell: ({ row }) => {
      return <span>{formatDate(row.getValue('publishedDate'))}</span>
    }
  },
]