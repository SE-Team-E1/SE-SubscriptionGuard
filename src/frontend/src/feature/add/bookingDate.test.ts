import { describe, expect, test } from 'vitest'
import { bookingDateFromIso, toBookingDateIso } from '@/feature/add/bookingDate'

describe('toBookingDateIso', () => {
  test('pads a real calendar day', () => {
    expect(toBookingDateIso('1', '2', '2026')).toBe('2026-02-01')
  })

  test('accepts 29 February in a leap year', () => {
    expect(toBookingDateIso('29', '02', '2024')).toBe('2024-02-29')
  })

  test('rejects days that roll into the next month', () => {
    expect(toBookingDateIso('31', '02', '2026')).toBeNull()
    expect(toBookingDateIso('29', '02', '2026')).toBeNull()
  })

  test('rejects partial and non-numeric parts', () => {
    expect(toBookingDateIso('1', '2', '')).toBeNull()
    expect(toBookingDateIso('ab', '02', '2026')).toBeNull()
    expect(toBookingDateIso('01', '02', '26')).toBeNull()
  })
})

describe('bookingDateFromIso', () => {
  test('uses UTC midnight for a valid day', () => {
    expect(bookingDateFromIso('2026-10-25').toISOString()).toBe('2026-10-25T00:00:00.000Z')
  })

  test('rejects an impossible day', () => {
    expect(() => bookingDateFromIso('2026-02-31')).toThrow('Invalid booking date')
  })
})
