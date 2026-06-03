"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeaderSort } from "@/components/data-table/data-table-column-header"
import { statuses } from "../data/data"
import { Topic } from "../data/schema"
import { Calendar, MessageSquare, Users } from "lucide-react"
import { formatDate, remainingDays } from "@/utils/helpers/helpers"
import { channels } from "../../topics/data/data"
import { cn } from "@/lib/utils"

export const columns: ColumnDef<Topic>[] = [
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
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {row.original.description}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "channels",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Channels" />
    ),
    meta: {
      className: 'max-w-xs whitespace-normal'
    },
    cell: ({ row }) => {
      return (
        <div className="flex gap-1 mt-2">
          {row.original.channels.map(c => {
            const channel = channels[c]
            return (
              <div key={channel.value} className={cn("rounded-sm p-1", "bg-" + channel.color + "/20")}>
                <channel.icon className={cn("size-4", "text-" + channel.color)} />
              </div>
            )
          })}
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
    accessorKey: "timeline",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Timeline" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <Calendar className="size-3 text-muted-foreground" />
            <span className="text-xs">Start: {formatDate(row.original.startDate)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="size-3 text-muted-foreground" />
            <span className="text-xs">End: {formatDate(row.original.endDate)}</span>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "dueIn",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Days Remaining" />
    ),
    cell: ({ row }) => {
      const noOfDays = remainingDays(row.original.endDate)!;
      if (noOfDays > 5) {
        return <p className="text-success-foreground text-xs font-semibold text-center">{noOfDays} days</p>
      }
      else if (noOfDays <= 5 && noOfDays > 2) {
        return <p className="text-warning-foreground text-xs font-semibold text-center">{noOfDays} days</p>
      }
      else {
        return <p className="text-destructive-foreground text-xs font-semibold text-center">{noOfDays} {noOfDays > 1 ? ' days' : 'day'}</p>
      }
    }
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
            <Users className="size-3 text-muted-foreground" />
            <p className="text-xs">
              {data.respondentsCount}/{data.totalRespondentsCount} responded
            </p>
          </div>
          <div className="flex space-x-1 items-center">
            <MessageSquare className="size-3 text-muted-foreground" />
            <p className="text-xs">
              {data.totalFeedbacksCount} feedbacks
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "userFeedback",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="My Feedback" />
    ),
    cell: ({ row }) => {
      return (
        <p className="text-xs">
          {row.original.myFeedbacksCount} {row.original.myFeedbacksCount > 1 ? 'entries' : 'entry'}
        </p>
      )
    },
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
        <Badge color={status.color} variant="outline">{status.value}</Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }
]