"use client"

import * as React from "react"
import { Check, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxItem {
    value: string;
    label: string;
}

interface ComboboxProps
    extends Omit<React.ComponentPropsWithoutRef<typeof Button>, "onChange"> {
    items: ComboboxItem[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    buttonClassName?: string;
    width?: string;
}

export function Combobox({
    items,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    value,
    onChange,
    className,
    buttonClassName,
    width = "w-full",
    ...props
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedValue, setSelectedValue] = React.useState(value || "");

    React.useEffect(() => {
        if (value !== undefined) {
            setSelectedValue(value);
        }
    }, [value]);

    const handleSelect = (currentValue: string) => {
        const newValue = currentValue === selectedValue ? "" : currentValue;
        setSelectedValue(newValue);
        onChange?.(newValue);
        setOpen(false);
    }

    const handleFilter = (item: ComboboxItem) => {
        return item.label.toLowerCase().includes(searchTerm.trim().toLowerCase());
    }

    const selectedLabel = items.find((item) => item.value === selectedValue)?.label
    const filteredItems = items.filter(handleFilter);

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
                    {selectedLabel || placeholder}
                    <ChevronDownIcon className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", className)}>
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onValueChange={(value) => setSearchTerm(value)}
                        className="h-9" />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {filteredItems.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.value}
                                    keywords={[item.label]}
                                    onSelect={handleSelect}
                                >
                                    {item.label}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            selectedValue === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
