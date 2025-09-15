import React, { useState, useMemo } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { SUPPORTED_TIMEZONES, TimezoneInfo } from '../utils/centralizedDb'

interface TimezoneSelectorProps {
  value: string
  onValueChange: (timezone: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function TimezoneSelector({ 
  value, 
  onValueChange, 
  disabled = false, 
  className = "",
  placeholder = "Select timezone" 
}: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedTimezone = useMemo(() => {
    return SUPPORTED_TIMEZONES.find(tz => tz.value === value)
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${className}`}
          disabled={disabled}
        >
          {selectedTimezone ? (
            <div className="flex items-center gap-2">
              <span>{selectedTimezone.label}</span>
              <span className="text-muted-foreground text-sm">({selectedTimezone.offset})</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search timezones..." 
            className="h-9"
          />
          <CommandEmpty>No timezone found.</CommandEmpty>
          <CommandGroup>
            <CommandList className="max-h-60 overflow-y-auto">
              {SUPPORTED_TIMEZONES.map((timezone: TimezoneInfo) => (
                <CommandItem
                  key={timezone.value}
                  value={`${timezone.label} ${timezone.offset} ${timezone.value}`}
                  onSelect={() => {
                    onValueChange(timezone.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === timezone.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{timezone.label}</span>
                    <span className="text-muted-foreground text-sm">{timezone.offset}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
