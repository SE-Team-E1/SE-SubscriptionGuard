const DAY = /^\d{1,2}$/
const MONTH = /^\d{1,2}$/
const YEAR = /^\d{4}$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * A real calendar day at UTC midnight.
 * Years 0–99 are rejected so Date.UTC does not map them onto 1900–1999.
 */
function utcCalendarDate(year: number, month: number, day: number): Date | null {
  if (year < 100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  const sameDay =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day

  return sameDay ? date : null
}

/** Returns YYYY-MM-DD when the parts are a real calendar day. */
export function toBookingDateIso(day: string, month: string, year: string): string | null {
  if (!DAY.test(day) || !MONTH.test(month) || !YEAR.test(year)) {
    return null
  }

  const monthNumber = Number(month)
  const dayNumber = Number(day)
  if (!utcCalendarDate(Number(year), monthNumber, dayNumber)) {
    return null
  }

  return `${year}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
}

/** Interprets YYYY-MM-DD as UTC midnight. */
export function bookingDateFromIso(value: string): Date {
  const match = ISO_DATE.exec(value)
  const yearText = match?.[1]
  const monthText = match?.[2]
  const dayText = match?.[3]
  const date =
    yearText && monthText && dayText
      ? utcCalendarDate(Number(yearText), Number(monthText), Number(dayText))
      : null

  if (!date) {
    throw new Error('Invalid booking date')
  }

  return date
}
