"use client"

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { createHttpClient } from "@/utils/api/createHttpClient";
import { useIsMobile } from "@/hooks/use-mobile";

import { Search, Users } from "lucide-react";
import ErrorState from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import ListLoading from "@/components/ui/list-loading";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";

import { User } from "../data/schema";
import { userListColumns } from "./columns";
import UserItem from "./user-item";

export default function UserList() {
    const httpClient = createHttpClient();
    const [search, setSearch] = useState<string>("");
    const isMobile = useIsMobile();

    const { data: users, error, isLoading, refetch } = useQuery<User[]>({
        queryKey: ['settings', 'users'],
        queryFn: () => httpClient.get('/api/users')
    })

    const filteredUsers = useMemo(() => {
        if (!users) return [];

        const query = search.toLowerCase().trim();

        const priority: Record<string, number> = {
            OWNER: 1,
            ADMIN: 2,
            MEMBER: 3,
        };

        return users
            .filter((user) => {
                return (
                    user.displayName.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.position.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                const rankA = priority[a.position] ?? 99;
                const rankB = priority[b.position] ?? 99;
                return rankA - rankB;
            });
    }, [search, users]);

    if (isLoading) return (
        <ListLoading 
            isMobile={isMobile} 
            columnCount={userListColumns.length} 
            rowsCount={15} />
    );

    if (error) return (
        <div>
            <ErrorState
                title="Oops, something went wrong!"
                message="We're sorry, but an unexpected error has occurred. Please try again or contact support if the issue persists."
                action={refetch} />
        </div>
    );
    
    if (!filteredUsers) return (
        <EmptyState
            title="No Users Found"
            description="Start inviting admins to manage topics and members to provide feedback."
            icons={[Users]}
        />
    )

    const renderList = () => {

        if (isMobile) {
            return (
                <div>
                    {filteredUsers.map(user => <UserItem key={user.id} user={user} />)}
                </div>
            )
        }

        return (
            <DataTable data={filteredUsers} columns={userListColumns} />
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-grey w-4 h-4" />
                <Input
                    className="ps-10"
                    type="search"
                    autoComplete="off"
                    placeholder="Search users by name, email, or role..."
                    onChange={(e) => setSearch(e.target.value)} />
            </div>
            {renderList()}
        </div>
    )
}