import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "../data/schema";
import { getAvatarUrl } from "@/lib/utils";

export default function UserItem({ user } : { user: User } ) {

    const [fname, lastname] = user.displayName.split(' ');
    const initials = `${fname[0].toUpperCase()}${lastname[0].toUpperCase()}`

    return (
        <div className="flex items-center py-6 gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" data-id="8">
            <span className="relative flex shrink-0 overflow-hidden rounded-full w-10 h-10" data-id="9">
                <Avatar className="aspect-square h-full w-full">
                    <AvatarImage src={getAvatarUrl(user.userImage ?? '', 'x40')} alt={user.displayName} />
                    <AvatarFallback className="rounded-full text-lg">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <img className="aspect-square h-full w-full" data-id="10" alt="@jaredpalmer" src="/placeholder-user.jpg" />
            </span>
            <div className="grid gap-1" data-id="12">
                <div className="font-medium" data-id="13">{user.displayName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400" data-id="14">{user.email}</div>
            </div>
            <div data-id="15" className="ml-auto w-5 h-5 opacity-0 group-hover:opacity-100"></div>
        </div>
    )
}