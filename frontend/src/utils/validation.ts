import React from 'react'
import DOMPurify from 'dompurify'

// Input validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  sanitize?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedValue?: any
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  noSpecialChars: /^[a-zA-Z0-9\s\-_]+$/,
  url: /^https?:\/\/.+/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  percentage: /^(100|[1-9]?\d)$/,
  positiveNumber: /^\d+(\.\d+)?$/,
  date: /^\d{4}-\d{2}-\d{2}$/
}

// Sanitization functions
export const sanitizers = {
  // HTML sanitization
  html: (value: string): string => {
    if (typeof value !== 'string') return ''
    return DOMPurify.sanitize(value, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    })
  },

  // Text sanitization (remove dangerous characters)
  text: (value: string): string => {
    if (typeof value !== 'string') return ''
    return value
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  },

  // Email sanitization
  email: (value: string): string => {
    if (typeof value !== 'string') return ''
    return value.toLowerCase().trim()
  },

  // Number sanitization
  number: (value: any): number | null => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? null : parsed
    }
    return null
  },

  // Date sanitization
  date: (value: string): string => {
    if (typeof value !== 'string') return ''
    const date = new Date(value)
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
  },

  // URL sanitization
  url: (value: string): string => {
    if (typeof value !== 'string') return ''
    try {
      const url = new URL(value)
      return url.toString()
    } catch {
      return ''
    }
  }
}

// Validation functions
export const validators = {
  required: (value: any): string | null => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required'
    }
    return null
  },

  minLength: (min: number) => (value: string): string | null => {
    if (typeof value !== 'string') return null
    if (value.length < min) {
      return `Must be at least ${min} characters long`
    }
    return null
  },

  maxLength: (max: number) => (value: string): string | null => {
    if (typeof value !== 'string') return null
    if (value.length > max) {
      return `Must be no more than ${max} characters long`
    }
    return null
  },

  pattern: (pattern: RegExp, message?: string) => (value: string): string | null => {
    if (typeof value !== 'string') return null
    if (!pattern.test(value)) {
      return message || 'Invalid format'
    }
    return null
  },

  email: (value: string): string | null => {
    if (typeof value !== 'string') return null
    if (!ValidationPatterns.email.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },

  phone: (value: string): string | null => {
    if (typeof value !== 'string') return null
    if (!ValidationPatterns.phone.test(value)) {
      return 'Please enter a valid phone number'
    }
    return null
  },

  url: (value: string): string | null => {
    if (typeof value !== 'string') return null
    if (!ValidationPatterns.url.test(value)) {
      return 'Please enter a valid URL'
    }
    return null
  },

  password: (value: string): string | null => {
    if (typeof value !== 'string') return null
    if (value.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!ValidationPatterns.strongPassword.test(value)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
    return null
  },

  percentage: (value: number): string | null => {
    if (typeof value !== 'number') return 'Must be a number'
    if (value < 0 || value > 100) {
      return 'Must be between 0 and 100'
    }
    return null
  },

  positiveNumber: (value: number): string | null => {
    if (typeof value !== 'number') return 'Must be a number'
    if (value <= 0) {
      return 'Must be a positive number'
    }
    return null
  },

  date: (value: string): string | null => {
    if (typeof value !== 'string') return null
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date'
    }
    return null
  },

  futureDate: (value: string): string | null => {
    const dateError = validators.date(value)
    if (dateError) return dateError
    
    const date = new Date(value)
    if (date <= new Date()) {
      return 'Date must be in the future'
    }
    return null
  },

  pastDate: (value: string): string | null => {
    const dateError = validators.date(value)
    if (dateError) return dateError
    
    const date = new Date(value)
    if (date >= new Date()) {
      return 'Date must be in the past'
    }
    return null
  }
}

// Main validation function
export function validateInput(value: any, rules: ValidationRule): ValidationResult {
  const errors: string[] = []
  let sanitizedValue = value

  // Apply sanitization first
  if (rules.sanitize && typeof value === 'string') {
    sanitizedValue = sanitizers.text(value)
  }

  // Apply validation rules
  if (rules.required) {
    const error = validators.required(sanitizedValue)
    if (error) errors.push(error)
  }

  if (rules.minLength && typeof sanitizedValue === 'string') {
    const error = validators.minLength(rules.minLength)(sanitizedValue)
    if (error) errors.push(error)
  }

  if (rules.maxLength && typeof sanitizedValue === 'string') {
    const error = validators.maxLength(rules.maxLength)(sanitizedValue)
    if (error) errors.push(error)
  }

  if (rules.pattern && typeof sanitizedValue === 'string') {
    const error = validators.pattern(rules.pattern)(sanitizedValue)
    if (error) errors.push(error)
  }

  if (rules.custom) {
    const error = rules.custom(sanitizedValue)
    if (error) errors.push(error)
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  }
}

// Form validation hook
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>>
) {
  const [values, setValues] = React.useState<T>(initialValues)
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string[]>>>({})
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = React.useCallback((field: keyof T, value: any) => {
    const rule = validationRules[field]
    if (!rule) return { isValid: true, errors: [] }

    const result = validateInput(value, rule)
    setErrors(prev => ({
      ...prev,
      [field]: result.errors
    }))

    return result
  }, [validationRules])

  const validateForm = React.useCallback(() => {
    const newErrors: Partial<Record<keyof T, string[]>> = {}
    let isValid = true

    Object.keys(validationRules).forEach(field => {
      const fieldKey = field as keyof T
      const result = validateField(fieldKey, values[fieldKey])
      if (!result.isValid) {
        newErrors[fieldKey] = result.errors
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validateField, validationRules])

  const setValue = React.useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Auto-validate on change if field has been touched
    if (touched[field]) {
      validateField(field, value)
    }
  }, [touched, validateField])

  const setTouchedField = React.useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, values[field])
  }, [values, validateField])

  const reset = React.useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    setTouchedField,
    validateField,
    validateForm,
    reset,
    isValid: Object.values(errors).every(fieldErrors => !fieldErrors || fieldErrors.length === 0)
  }
}

// Common validation rules for the application
export const CommonValidationRules = {
  email: {
    required: true,
    pattern: ValidationPatterns.email,
    sanitize: true
  },
  password: {
    required: true,
    minLength: 8,
    custom: validators.password
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: ValidationPatterns.alphanumericWithSpaces,
    sanitize: true
  },
  projectName: {
    required: true,
    minLength: 3,
    maxLength: 200,
    pattern: ValidationPatterns.noSpecialChars,
    sanitize: true
  },
  description: {
    maxLength: 1000,
    sanitize: true
  },
  percentage: {
    required: true,
    custom: validators.percentage
  },
  budget: {
    custom: validators.positiveNumber
  },
  date: {
    required: true,
    custom: validators.date
  },
  futureDate: {
    required: true,
    custom: validators.futureDate
  },
  phone: {
    pattern: ValidationPatterns.phone,
    sanitize: true
  },
  url: {
    custom: validators.url
  }
}
