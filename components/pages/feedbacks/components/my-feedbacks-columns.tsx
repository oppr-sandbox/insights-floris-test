"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeaderSort } from "@/components/data-table/data-table-column-header"
import { statuses } from "../data/data"
import { Feedback } from "../data/schema"
import { formatDate } from "@/utils/helpers/helpers"
import { TopicStatus } from "../../topics/data/schema"
import { channels } from "../../topics/data/data"
import { cn } from "@/lib/utils"

export const columns: ColumnDef<Feedback>[] = [
  {
    accessorKey: "feedbackCode",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Feedback ID" />
    ),
    meta: {
      className: 'min-w-[120px] whitespace-normal'
    },
    cell: ({ row }) => {
      return (
        <div className="text-xs text-muted-foreground">{row.original.feedbackCode}</div>
      )
    },
  },
  {
    accessorKey: "topic",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Topic" />
    ),
    meta: {
      className: 'min-w-xs whitespace-normal'
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
    accessorKey: "submitted",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Submitted" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-xs">{formatDate(row.original.dateSubmitted)}</span>
      )
    }
  },
  {
    accessorKey: "Content",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Content" />
    ),
    cell: ({ row }) => {
      return (
        <div
          className="min-w-xs max-w-xs line-clamp-1 text-wrap text-xs"
          title={row.original.text ?? ''}>{row.original.text}</div>
      )
    }
  },
  {
    accessorKey: "status",
    enableHiding: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Topic Status" />
    ),
    cell: ({ row }) => {
      const status = statuses[row.original.topicStatus as TopicStatus];


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
  },
  // {
  //   id: "actions",
  //   header: ({ column }) => (
  //     <DataTableColumnHeaderSort column={column} title="Action" />
  //   ),
  //   cell: ({ row }) => (
  //     <FeedbackModalForm
  //       id={row.original.id}
  //       topicId={row.original.topicId}
  //       topicChannels={row.original.channels}
  //       topicCode={row.original.topicCode}
  //       topicTitle={row.original.topicName}
  //     >
  //         <Button size="xs" variant="outline">
  //             <Pencil />
  //             Edit
  //         </Button>
  //       </FeedbackModalForm>
  //   ),
  // },
]