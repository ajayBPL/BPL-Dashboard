import React, { useState, useMemo } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { SUPPORTED_CURRENCIES, CurrencyInfo } from '../utils/centralizedDb'

interface CurrencySelectorProps {
  value: string
  onValueChange: (currency: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function CurrencySelector({ 
  value, 
  onValueChange, 
  disabled = false, 
  className = "",
  placeholder = "Select currency" 
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedCurrency = useMemo(() => {
    return SUPPORTED_CURRENCIES.find(currency => currency.code === value)
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
          {selectedCurrency ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{selectedCurrency.symbol}</span>
              <span>{selectedCurrency.code}</span>
              <span className="text-muted-foreground">- {selectedCurrency.name}</span>
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
            placeholder="Search currencies..." 
            className="h-9"
          />
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandGroup>
            <CommandList className="max-h-60 overflow-y-auto">
              {SUPPORTED_CURRENCIES.map((currency: CurrencyInfo) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code} ${currency.name} ${currency.symbol}`}
                  onSelect={() => {
                    onValueChange(currency.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === currency.code ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{currency.symbol}</span>
                    <span>{currency.code}</span>
                    <span className="text-muted-foreground">- {currency.name}</span>
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

// Hook for currency formatting
export function useCurrency() {
  const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
    if (!currency) return `${amount} ${currencyCode}`
    
    try {
      const formatter = new Intl.NumberFormat(currency.locale || 'en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces
      })
      return formatter.format(amount)
    } catch {
      return `${currency.symbol}${amount.toFixed(currency.decimalPlaces)}`
    }
  }

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
    return currency?.symbol || currencyCode
  }

  return { formatCurrency, getCurrencySymbol }
}