import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string, currency = 'USD'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numPrice)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `OPT-${timestamp}-${random}`
}

export function generateSku(prefix = 'SKU'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase()
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last
}

export function calculateDiscount(
  originalPrice: number,
  discountedPrice: number
): number {
  if (originalPrice <= 0) return 0
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}

export const FRAME_SHAPES = [
  { value: 'RECTANGLE', label: 'Rectangle' },
  { value: 'SQUARE', label: 'Square' },
  { value: 'ROUND', label: 'Round' },
  { value: 'OVAL', label: 'Oval' },
  { value: 'CAT_EYE', label: 'Cat Eye' },
  { value: 'AVIATOR', label: 'Aviator' },
  { value: 'BROWLINE', label: 'Browline' },
  { value: 'GEOMETRIC', label: 'Geometric' },
  { value: 'OVERSIZED', label: 'Oversized' },
  { value: 'WRAP', label: 'Wrap' },
]

export const FRAME_MATERIALS = [
  { value: 'ACETATE', label: 'Acetate' },
  { value: 'METAL', label: 'Metal' },
  { value: 'TITANIUM', label: 'Titanium' },
  { value: 'TR90', label: 'TR90' },
  { value: 'WOOD', label: 'Wood' },
  { value: 'MIXED', label: 'Mixed Materials' },
  { value: 'PLASTIC', label: 'Plastic' },
  { value: 'STAINLESS_STEEL', label: 'Stainless Steel' },
]

export const FRAME_TYPES = [
  { value: 'FULL_RIM', label: 'Full Rim' },
  { value: 'SEMI_RIMLESS', label: 'Semi-Rimless' },
  { value: 'RIMLESS', label: 'Rimless' },
]

export const LENS_TYPES = [
  { value: 'CLEAR', label: 'Clear' },
  { value: 'BLUE_LIGHT', label: 'Blue Light Blocking' },
  { value: 'PHOTOCHROMIC', label: 'Photochromic (Transitions)' },
  { value: 'POLARIZED', label: 'Polarized' },
  { value: 'SUNGLASSES', label: 'Sunglasses' },
  { value: 'READING', label: 'Reading' },
  { value: 'PROGRESSIVE', label: 'Progressive' },
  { value: 'BIFOCAL', label: 'Bifocal' },
  { value: 'NON_PRESCRIPTION', label: 'Non-Prescription' },
]
