import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TabsContent } from "@/components/ui/tabs";
import { IconBulb } from "@tabler/icons-react";
import { Users } from "lucide-react";
import { SaveFieldType, useTopicDetail } from "../hooks/useTopicDetail";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TopicStatus, User } from "../../data/schema";
import { Input } from "@/components/ui/input";
import { debounce } from "@/utils/helpers/helpers";
import { DataTable } from "@/components/data-table/data-table";
import { ActiveUsersData, usersColumns } from "./users-columns";
import { Spinner } from "@/components/ui/spinner";
import { Row } from "@tanstack/react-table";

type AccessOption = {
    value: AccessOptionEnum;
    text: string;
    description: string;
    count: number;
};

enum AccessOptionEnum {
    All = 'ALL',
    Specific = 'SPECIFIC',
    Private = 'PRIVATE'
}

type Department = {
    id: string
    position: string
    isExpanded: boolean;
    users: User[]
}

function groupUsersByPosition(users: User[]): Department[] {
    const map = new Map<string, User[]>()

    for (const user of users) {
        if (!map.has(user.position)) {
            map.set(user.position, [])
        }
        map.get(user.position)!.push(user)
    }

    return Array.from(map.entries()).map(([position, users]) => ({
        id: position.toLowerCase().replace(/\s+/g, "-"),
        isExpanded: true,
        position,
        users,
    }))
}

export default function UserAccess() {
    const { updateFormField, saveField, data } = useTopicDetail();
    const isAutoSave = data!.status === TopicStatus.Draft;
    const [search, setSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>(data!.userIds?.reduce((acc, u) => {
        acc[u] = true;
        return acc;
    }, {} as Record<string, boolean>) ?? {});


    const determineSelection = () => {
        if (data!.isAllUsers) {
            return AccessOptionEnum.All;
        } else if (data!.userIds && data!.userIds.length == 0) {
            return AccessOptionEnum.Private;
        } else {
            return AccessOptionEnum.Specific;
        }
    }
    const [selectedRadio, setSelectedRadio] = useState<AccessOptionEnum>(determineSelection());

    const usersRaw = useQuery(api.users.list);
    const usersResponse = usersRaw as unknown as ActiveUsersData[] | undefined;
    const isLoading = usersRaw === undefined;

    const [accessOptions, setAccessOptions] = useState<Record<AccessOptionEnum, AccessOption>>({
        [AccessOptionEnum.All]: {
            value: AccessOptionEnum.All,
            text: "All Users",
            description: "Everyone in the organization can participate",
            count: 0,
        },
        [AccessOptionEnum.Specific]: {
            value: AccessOptionEnum.Specific,
            text: "Specific Users",
            description: "Only selected users can participate",
            count: 0,
        },
        [AccessOptionEnum.Private]: {
            value: AccessOptionEnum.Private,
            text: "No Access",
            description: "Topic is private, no one can participate yet",
            count: 0,
        },
    });


    const debouncedSave = useMemo(
        () =>
            debounce((val: SaveFieldType) => {
                saveField(val);
            }, 500),
        [saveField]
    );

    const autoSaveAccessOption = useCallback((value: AccessOptionEnum) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let updatedVal: Record<string, any>;
        switch (value) {
            case AccessOptionEnum.All:
                updatedVal = {
                    isAllUsers: true,
                    userIds: []
                }
                break;
            case AccessOptionEnum.Specific:
                updatedVal = {
                    isAllUsers: false,
                    userIds: Object.keys(selectedUsers)
                }
                break;
            case AccessOptionEnum.Private:
            default:
                updatedVal = {
                    isAllUsers: false,
                    userIds: []
                }
                break;
        }
        if (isAutoSave) {
            debouncedSave(updatedVal);
        } else {
            updateFormField(updatedVal)
        }

    }, [debouncedSave, isAutoSave, updateFormField, selectedUsers]);

    useEffect(() => {
        if (usersResponse) {
            setAccessOptions(prev => ({
                ...prev,
                [AccessOptionEnum.All]: {
                    ...prev[AccessOptionEnum.All],
                    count: usersResponse.length,
                },
            }));
        }
    }, [usersResponse]);

    useEffect(() => {
        const selectedUserIds = new Set(Object.keys(selectedUsers));
        const previousIds = new Set(data!.userIds);
        const idsChanged =
            selectedUserIds.size !== previousIds.size ||
            [...selectedUserIds].some(id => !previousIds.has(id));

        if (idsChanged) {
            autoSaveAccessOption(selectedRadio);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSaveAccessOption, selectedUsers]);


    const filteredUsers = useMemo(() => {
        const filterBySearch = (user: ActiveUsersData) => {
            if (!search.trim()) return true;

            const searchValue = search.toLowerCase();

            return (
                user.displayName.toLowerCase().includes(searchValue) ||
                user.email.toLowerCase().includes(searchValue) ||
                user.position.toLowerCase().includes(searchValue) ||
                user.discipline?.toLowerCase().includes(searchValue) ||
                user.location?.toLowerCase().includes(searchValue)
            );
        };

        return usersResponse?.filter(filterBySearch) ?? [];
    }, [usersResponse, search]);

    const onRowClick = (row: Row<ActiveUsersData>) => {
        const rowIsSelected = row.getIsSelected();
        row.toggleSelected(!rowIsSelected);
        setSelectedUsers(prev => {
            const updated = { ...prev };

            if (rowIsSelected) {
                // deselect → remove key
                delete updated[row.id];
            } else {
                // select → mark as true
                updated[row.id] = true;
            }

            return updated;
        });
    };

    const getRowId = (originalRow: ActiveUsersData): string => {
        return originalRow.id
    }

    return (
        <TabsContent value="user-access">
            <div className="flex flex-col space-y-4 mt-4">
                <div>
                    <h4 className="font-semibold">User Access</h4>
                    <p className="text-muted-foreground">Control who can participate in this topic</p>
                </div>

                <Label><span>Access Level <span className="text-destructive">*</span></span></Label>
                <RadioGroup
                    defaultValue={selectedRadio}
                    onValueChange={(val) => {
                        const value = val as AccessOptionEnum;
                        setSelectedRadio(value);
                        autoSaveAccessOption(value);
                    }}>
                    <div className="flex flex-col space-y-2">
                        {
                            Object.values(accessOptions).map(option => (
                                <Label key={option.value} className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary/60 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-primary/90 dark:has-[[aria-checked=true]]:bg-blue-950">
                                    <RadioGroupItem
                                        id={option.value}
                                        value={option.value}
                                    />
                                    <div className="grid gap-1.5 font-normal w-full">
                                        <div className="flex justify-between">
                                            <div className="flex space-x-2 items-center">
                                                <Users className="size-4" />
                                                <p className="text-sm leading-none font-medium">
                                                    {option.text}
                                                </p>
                                            </div>
                                            {(() => {
                                                switch (option.value) {
                                                    case AccessOptionEnum.All:
                                                        return (
                                                            <span className="text-primary text-xs">
                                                                {option.count} users
                                                            </span>
                                                        );
                                                    case AccessOptionEnum.Specific:
                                                        return (
                                                            <span className="text-primary text-xs">
                                                                {Object.keys(selectedUsers).length ?? 0} selected
                                                            </span>
                                                        );
                                                    case AccessOptionEnum.Private:
                                                    default:
                                                        return null;
                                                }
                                            })()}
                                        </div>
                                        <p className="text-muted-foreground text-sm">
                                            {option.description}
                                        </p>
                                    </div>
                                </Label>
                            ))
                        }
                    </div>
                </RadioGroup>
                {selectedRadio === AccessOptionEnum.Specific && usersResponse && (
                    <div className="flex flex-col space-y-4">
                        <Input
                            type="text"
                            placeholder="Search user, position, discipline, or location..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                            }}
                        />
                        <DataTable
                            data={filteredUsers}
                            columns={usersColumns}
                            enableMultiRowSelection
                            selectedRows={selectedUsers}
                            enablePagination={false}
                            onRowClick={onRowClick}
                            getRowId={getRowId}
                        />
                        {
                            isLoading && (
                                <div className="flex flex-1 justify-center py-4 items-center">
                                    <Spinner />
                                </div>
                            )
                        }
                    </div>
                )}


                <Alert variant="warning">
                    <AlertTitle>
                        <div className="flex flex-row items-center space-x-1">
                            <IconBulb className="size-6" />
                            <h5>Access Tips:</h5>
                        </div>
                    </AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc text-warning-foreground ps-6">
                            <li><span className="font-semibold">All Users:</span> Best for company-wide feedback</li>
                            <li><span className="font-semibold">Specific Users:</span> Target feedback from relevant stakeholders</li>
                            <li><span className="font-semibold">No Access:</span> Keep topic private while finalizing details</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            </div>
        </TabsContent>
    )
}