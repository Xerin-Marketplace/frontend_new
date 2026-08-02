/**
 * Input validation & sanitization utilities
 * Production-grade validators for forms, user input, and API data
 */

// ─── Email ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false
  return EMAIL_REGEX.test(email.trim().toLowerCase())
}

// ─── Phone ──────────────────────────────────────────────────────────────────

// Supports +255, 0XX XXX XXXX, international formats
const PHONE_REGEX_TZ = /^(\+?255|0)?\s*[1-9]\d{8}$/
const PHONE_REGEX_INTL = /^\+?[1-9]\d{6,14}$/

export function isValidPhone(phone: string, countryCode = "TZ"): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "")
  if (countryCode === "TZ") {
    return PHONE_REGEX_TZ.test(cleaned)
  }
  return PHONE_REGEX_INTL.test(cleaned)
}

// ─── Password ───────────────────────────────────────────────────────────────

export interface PasswordStrength {
  score: number // 0-4
  label: string
  valid: boolean
  issues: string[]
}

export function validatePassword(password: string): PasswordStrength {
  const issues: string[] = []
  let score = 0

  if (password.length < 10) {
    issues.push("At least 10 characters")
  } else if (password.length >= 16) {
    score++
  }

  if (/[a-z]/.test(password)) score++
  else issues.push("At least one lowercase letter")

  if (/[A-Z]/.test(password)) score++
  else issues.push("At least one uppercase letter")

  if (/[0-9]/.test(password)) score++
  else issues.push("At least one number")

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else issues.push("At least one special character")

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
  const valid = password.length >= 10 && issues.length === 0

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    valid,
    issues,
  }
}

// ─── URL ────────────────────────────────────────────────────────────────────

const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/

export function isValidUrl(url: string): boolean {
  if (!url) return false
  return URL_REGEX.test(url.trim())
}

// ─── UUID ───────────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(uuid: string): boolean {
  if (!uuid) return false
  return UUID_REGEX.test(uuid.trim())
}

// ─── Number ─────────────────────────────────────────────────────────────────

export function isValidNumber(value: unknown, min?: number, max?: number): boolean {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (typeof num !== "number" || isNaN(num)) return false
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false
  return true
}

// ─── String sanitization ────────────────────────────────────────────────────

export function sanitizeHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

// ─── Form validators ────────────────────────────────────────────────────────

export type ValidationResult = { valid: boolean; message?: string }

export function required(value: unknown): ValidationResult {
  if (value === null || value === undefined || value === "") {
    return { valid: false, message: "This field is required" }
  }
  return { valid: true }
}

export function minLength(value: string, min: number): ValidationResult {
  if (!value || value.length < min) {
    return { valid: false, message: `Must be at least ${min} characters` }
  }
  return { valid: true }
}

export function maxLength(value: string, max: number): ValidationResult {
  if (value && value.length > max) {
    return { valid: false, message: `Must be at most ${max} characters` }
  }
  return { valid: true }
}

export function emailValidator(value: string): ValidationResult {
  if (!isValidEmail(value)) {
    return { valid: false, message: "Please enter a valid email address" }
  }
  return { valid: true }
}

export function phoneValidator(value: string, countryCode?: string): ValidationResult {
  if (!isValidPhone(value, countryCode)) {
    return { valid: false, message: "Please enter a valid phone number" }
  }
  return { valid: true }
}

export function passwordValidator(value: string): ValidationResult {
  const strength = validatePassword(value)
  if (!strength.valid) {
    return { valid: false, message: strength.issues.join(", ") }
  }
  return { valid: true }
}

export function matchValidator(value: string, matchValue: string): ValidationResult {
  if (value !== matchValue) {
    return { valid: false, message: "Values do not match" }
  }
  return { valid: true }
}

// ─── Price ──────────────────────────────────────────────────────────────────

export function isValidPrice(value: unknown): boolean {
  return isValidNumber(value, 0, 999999999999.99)
}

// ─── File upload ────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateImageFile(file: File): ValidationResult {
  if (!file) return { valid: false, message: "No file selected" }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, message: "Only JPEG, PNG, WebP, and GIF images are allowed" }
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, message: "Image must be less than 5MB" }
  }
  return { valid: true }
}
