import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User } from "../data/schema";
import { Button } from "@/components/ui/button";
import { MailX, MoreVertical, Send } from "lucide-react";
import { useUserList } from "../hooks/useUserList";

export function UserActions({ user }: { user: User }) {
    const { dispatch } = useUserList();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="data-[state=open]:bg-muted size-8"
                >
                    <MoreVertical />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem
                    className="flex justify-between"
                    onClick={(e) => {
                        e.stopPropagation()
                        dispatch({ type: 'CONFIRM_RESEND_INVITE', payload: user })
                    }}>
                    Resend Invite
                    <Send />
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="flex justify-between"
                    onClick={(e) => {
                        e.stopPropagation()
                        dispatch({ type: 'CONFIRM_CANCEL_INVITE', payload: user })
                    }}>
                    Cancel Invite
                    <MailX />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}