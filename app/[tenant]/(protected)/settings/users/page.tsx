"use client"

import { ConfirmCancelInviteDialog } from "@/components/pages/settings/users/components/confirm-cancel-invite"
import { ConfirmResendInviteDialog } from "@/components/pages/settings/users/components/confirm-resend-invite"
import InviteUserModal from "@/components/pages/settings/users/components/invite-user-modal"
import UserList from "@/components/pages/settings/users/components/user-list"
import { UserListProvider } from "@/components/pages/settings/users/hooks/useUserList"

export default function UsersPage() {
    return (
        <div className="flex flex-col flex-1 gap-4">
            <div className="flex items-center justify-between">
                <div className="text-lg font-medium">Team Members</div>
                <div className="flex gap-2">
                    <InviteUserModal />
                </div>
            </div>
            <UserListProvider>
                <UserList />
                <ConfirmResendInviteDialog />
                <ConfirmCancelInviteDialog />
            </UserListProvider>
        </div>
    )
}