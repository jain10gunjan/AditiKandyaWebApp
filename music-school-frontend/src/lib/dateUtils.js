/**
 * Date utilities for consistent local-date handling across admin routes.
 * Use these instead of toISOString().split('T')[0] to avoid timezone mismatches
 * (e.g. "today" and month grids being wrong in non-UTC timezones).
 */

/**
 * Get YYYY-MM-DD for a Date in the user's local timezone.
 * @param {Date} d
 * @returns {string}
 */
export function toLocalDateString(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Get YYYY-MM for a Date in the user's local timezone.
 * @param {Date} d
 * @returns {string}
 */
export function toLocalMonthString(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Parse a YYYY-MM-DD string as a local date (noon to avoid DST edge cases).
 * @param {string} dateStr
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date(NaN)
  const [y, m, d] = dateStr.split('-').map(Number)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date(NaN)
  return new Date(y, m - 1, d)
}
