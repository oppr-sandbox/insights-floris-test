import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TopicLoading ({ view, columnCount, rowsCount }: { view: string, columnCount: number, rowsCount: number }) {
    return (
        view === 'cards' ? (
            <div className="grid md:grid-cols-3 gap-2">
                {[...Array(rowsCount)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full bg-secondary/20" />
                ))}
            </div>
        ) : (
            <div className="flex flex-col">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            {
                                [...Array(columnCount)].map((_, i) => (
                                    <TableHead key={i}>
                                        <Skeleton className="h-3 w-[100px] bg-secondary/20" />
                                    </TableHead>
                                ))
                            }
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {[...Array(rowsCount)].map((_, i) => (
                        <TableRow key={i}>
                            {
                                [...Array(columnCount)].map((_, i) => (
                                    <TableCell key={i}>
                                        <Skeleton className="h-3 w-[100px] bg-secondary/20" />
                                    </TableCell>
                                ))
                            }
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
        )
    )
}