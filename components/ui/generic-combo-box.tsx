"use client";

import * as React from "react";
import { Check, ChevronDownIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface BaseItem {
    [key: string]: any;
}

interface GenericComboboxProps<T extends BaseItem>
    extends Omit<React.ComponentPropsWithoutRef<typeof Button>, "onChange"> {
    items: T[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    value?: string;
    width?: string;
    onChange?: (value: string) => void;
    getValue: (item: T) => string;
    getLabel: (item: T) => string;
    renderAddForm?: (
        onAdd: (newItem: T) => void,
        onCancel: () => void
    ) => React.ReactNode;
    className?: string;
    buttonClassName?: string;
}

export function GenericCombobox<T extends BaseItem>({
    items: initialItems,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    value,
    onChange,
    getValue,
    getLabel,
    renderAddForm,
    className,
    buttonClassName,
    width = "w-full",
    ...props
}: GenericComboboxProps<T>) {
    const [open, setOpen] = React.useState(false);
    const [items, setItems] = React.useState(initialItems);
    const [selectedValue, setSelectedValue] = React.useState(value || "");
    const [searchTerm, setSearchTerm] = React.useState("");
    const [showAddForm, setShowAddForm] = React.useState(false);

    const handleSelect = (val: string) => {
        const newValue = val === selectedValue ? "" : val;
        setSelectedValue(newValue);
        onChange?.(newValue);
        setOpen(false);
    };

    const handleAdd = (newItem: T) => {
        setSelectedValue(getValue(newItem));
        onChange?.(getValue(newItem));
        setSearchTerm('');
        setShowAddForm(false);
        setOpen(false);
    };

    const filteredItems = items.filter((item) =>
        getLabel(item).toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    const selectedLabel = items.find(
        (item) => getValue(item) === selectedValue
    );

    React.useEffect(() => {
        if (initialItems.length > 0) {
            setItems(initialItems)
        }

    }, [initialItems])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    {...props}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(width, "justify-between", buttonClassName)}
                >
                    {selectedLabel ? getLabel(selectedLabel) : placeholder}
                    <ChevronDownIcon className="opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className={cn(
                    "w-[var(--radix-popover-trigger-width)] p-0",
                    className
                )}
            >
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onValueChange={(val) => {
                            setSearchTerm(val);
                            setShowAddForm(false);
                        }}
                        className="h-9"
                    />

                    <CommandList>
                        {filteredItems.length === 0 && !showAddForm ? (
                            <CommandEmpty className="flex flex-col items-center gap-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    {emptyMessage}
                                </div>
                                {renderAddForm && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 flex items-center gap-2"
                                        onClick={() => setShowAddForm(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add new item
                                    </Button>
                                )}
                            </CommandEmpty>
                        ) : showAddForm && renderAddForm ? (
                            <div className="p-4 border-t">
                                {renderAddForm(handleAdd, () =>
                                    setShowAddForm(false)
                                )}
                            </div>
                        ) : (
                            <CommandGroup>
                                {filteredItems.map((item) => (
                                    <CommandItem
                                        key={getValue(item)}
                                        value={getValue(item)}
                                        keywords={[getLabel(item)]}
                                        onSelect={handleSelect}
                                    >
                                        {getLabel(item)}
                                        <Check
                                            className={cn(
                                                "ml-auto",
                                                selectedValue === getValue(item)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
