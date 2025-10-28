import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import { cn } from "./utils"

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  group?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  onCreateNew?: () => void
  createNewLabel?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
  onCreateNew,
  createNewLabel = "Create New",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (selectedValue: string) => {
    console.log('🔵 Selected value:', selectedValue)
    onValueChange(selectedValue)
    setOpen(false)
  }

  // Group options by their group property
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SearchableSelectOption[]> = {}
    
    options.forEach((option) => {
      const groupName = option.group || "default"
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(option)
    })
    
    console.log('📊 Grouped options:', groups)
    return groups
  }, [options])

  React.useEffect(() => {
    console.log('🔄 SearchableSelect rendered with', options.length, 'options')
  }, [options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? (
              <>
                {selectedOption.icon && <span className="mr-2">{selectedOption.icon}</span>}
                {selectedOption.label}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        style={{ maxWidth: '500px', pointerEvents: 'auto' }}
      >
        <Command shouldFilter>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList 
            className="max-h-[300px] overflow-y-scroll"
            style={{ 
              maxHeight: '300px', 
              overflowY: 'scroll',
              overflowX: 'hidden',
              pointerEvents: 'auto'
            }}
          >
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            
            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <CommandGroup 
                key={groupName} 
                heading={groupName !== "default" ? groupName : undefined}
                className="overflow-visible"
              >
                {groupOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className="cursor-pointer flex items-center gap-2 px-2 py-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {option.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          
          {/* Create New button - outside CommandList so it's always visible */}
          {onCreateNew && (
            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => {
                  console.log('🆕 Create new button clicked')
                  setOpen(false)
                  setTimeout(() => onCreateNew(), 100)
                }}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-primary hover:bg-accent rounded-sm cursor-pointer"
              >
                <ChevronsUpDown className="h-4 w-4 rotate-90" />
                {createNewLabel}
              </button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
