import { RenewalPeriodUnitEnum, type Price, type RenewalPeriod } from '@/domain/domain'

const LOCALE = 'de-DE'

const dateFormat = (timeZone?: string) =>
  new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone })

/** Formats a price with its currency symbol, e.g. "9,99 €". */
export function formatPrice(price: Price): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: price.currency }).format(
    price.amount,
  )
}

/**
 * Formats a date-only value (e.g. the booking date) as "dd.MM.yyyy".
 * Date-only values are stored as UTC midnight, so they are formatted in UTC
 * to avoid showing the previous day in timezones west of UTC.
 */
export function formatDateOnly(date: Date): string {
  return dateFormat('UTC').format(date)
}

/** Formats a timestamp (e.g. createdAt) as "dd.MM.yyyy" in the user's local timezone. */
export function formatTimestampDate(date: Date): string {
  return dateFormat().format(date)
}

const SINGULAR_LABEL: Record<RenewalPeriodUnitEnum, string> = {
  [RenewalPeriodUnitEnum.DAYS]: 'täglich',
  [RenewalPeriodUnitEnum.WEEKS]: 'wöchentlich',
  [RenewalPeriodUnitEnum.MONTHS]: 'monatlich',
  [RenewalPeriodUnitEnum.YEARS]: 'jährlich',
}

const PLURAL_UNIT: Record<RenewalPeriodUnitEnum, string> = {
  [RenewalPeriodUnitEnum.DAYS]: 'Tage',
  [RenewalPeriodUnitEnum.WEEKS]: 'Wochen',
  [RenewalPeriodUnitEnum.MONTHS]: 'Monate',
  [RenewalPeriodUnitEnum.YEARS]: 'Jahre',
}

/** Formats a renewal period as "monatlich" (amount 1) or "alle 3 Monate". */
export function formatRenewal(renewal: RenewalPeriod): string {
  if (renewal.amount === 1) {
    return SINGULAR_LABEL[renewal.unit]
  }
  return `alle ${renewal.amount} ${PLURAL_UNIT[renewal.unit]}`
}
