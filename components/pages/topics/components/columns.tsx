"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader, DataTableColumnHeaderSort } from "@/components/data-table/data-table-column-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

import { statuses } from "../data/data"
import { Topic, TopicStatus } from "../data/schema"
import { formatDate } from "@/utils/helpers/helpers"
import Link from "next/link"
import { getAvatarUrl } from "@/lib/utils"
import { ItemActions } from "./item-actions"

export const columns: ColumnDef<Topic>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Topic" />
    ),
    meta: {
      className: 'max-w-xs whitespace-normal'
    },
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{row.original.topicCode}</span>
          <span className="max-w-[500px] truncate font-medium">
            <Link href={`/topics/${row.original.topicCode}`} className="hover:underline">
              {row.getValue("name")}
            </Link>
          </span>
          <div className="text-xs text-muted-foreground line-clamp-2" title={row.original.description}>
            {row.original.description}
          </div>
        </div>
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
  {
    accessorKey: "respondents",
    enableHiding: false,
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Respondents" />
    ),
    cell: ({ row }) => {

      const topic = row.original;
      const moreRespondents = topic.respondentsCount - (topic.recentRespondents ?? []).length

      return (
        <div className="flex space-x-2 items-center">
          <div className="*:data-[slot=avatar]:ring-background flex -space-x-1 *:data-[slot=avatar]:ring-1">
            {
              topic.recentRespondents?.map((respondent, index) => (
                <Avatar className="h-6 w-6" key={index}>
                  <AvatarImage src={getAvatarUrl(respondent.image, 'x24')} alt={respondent.name} />
                  <AvatarFallback>{respondent.initials}</AvatarFallback>
                </Avatar>
              ))
            }
          </div>
          {
            moreRespondents > 0 && (
              <span className="text-xs text-foreground font-semibold">
                +{moreRespondents} more
              </span>
            )
          }
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "endDate",
    enableHiding: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      return <span>{formatDate(row.getValue('endDate'))}</span>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "progress",
    enableHiding: false,
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Progress & Feedback" />
    ),
    cell: ({ row }) => {

      const data = row.original;
      const percentage = Math.round(data.respondentsCount / data.totalRespondentsCount * 100);
      const status = data.status;

      if (status === 'COMPLETED') {
        return (
          <div className="flex flex-col items-start space-y-1">
            <span className="text-xs font-semibold text-success-foreground">Complete</span>
            <p className="text-xs text-muted-foreground">
              {data.respondentsCount} participants
            </p>
            <p className="text-xs text-muted-foreground">
              {data.totalFeedbacksCount} feedbacks collected
            </p>
          </div>
        )
      }
      else if (status === 'DRAFT') {
        return (
          <span className="text-xs font-semibold text-muted-foreground">Not Started</span>
        )
      }
      else {
        return (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex w-full items-center space-x-2">
              <Progress value={percentage} />
              <p className="text-xs text-muted-foreground">{percentage}%</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.respondentsCount}/{data.totalRespondentsCount} responded
            </p>
            <p className="text-xs text-muted-foreground">
              {data.totalFeedbacksCount} feedbacks
            </p>
          </div>
        )
      }
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ItemActions topic={row.original} />
      </div>
    ),
  },
]