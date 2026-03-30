import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Date (or ISO string) to a localized Brazilian date string.
 * e.g. "29/03/2026" or "29 de março de 2026" depending on options.
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', options)
}

/**
 * Format a number as Brazilian Real (BRL).
 * e.g. 1234.5 → "R$ 1.234,50"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a Brazilian phone number for display.
 * Handles both 10-digit (landline) and 11-digit (mobile) formats.
 * Input can be raw digits or E.164.
 * e.g. "11987654321" → "(11) 98765-4321"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  // Strip everything that is not a digit
  const digits = phone.replace(/\D/g, '')

  // Remove country code +55 prefix
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits

  if (local.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return phone
}

/**
 * Normalize a phone number to E.164 format (+55XXXXXXXXXXX).
 * Returns the original string if it cannot be normalized.
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')

  // Already has country code
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`
  }
  // Brazilian number without country code
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`
  }
  // Already in E.164 without +
  if (phone.startsWith('+')) return phone
  return phone
}

/**
 * Interpolate template variables in a message string.
 * Variable placeholders use the format {{variable_name}}.
 * e.g. interpolateTemplate("Olá {{name}}!", { name: "Maria" }) → "Olá Maria!"
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key]
    if (value === null || value === undefined) return match
    return String(value)
  })
}

/**
 * Convert a string to a URL-friendly slug.
 * e.g. "Salão da Maria" → "salao-da-maria"
 */
export function slugify(text: string): string {
  return normalizeText(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Remove diacritics/accents from a string (normalize to ASCII).
 * e.g. "Ação" → "Acao"
 */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Truncate a string to a maximum length, appending an ellipsis if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Capitalize the first letter of each word.
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check whether a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Safe JSON parse — returns null instead of throwing on invalid JSON.
 */
export function safeJsonParse<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * Sleep for a given number of milliseconds (useful in async flows).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate a simple random alphanumeric ID (not cryptographically secure).
 */
export function generateId(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Returns the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * Using pt-BR convention (numbers only, no suffix in Portuguese).
 */
export function ordinalize(n: number): string {
  return `${n}º`
}
