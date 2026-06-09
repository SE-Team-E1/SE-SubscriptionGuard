export enum RenewalPeriodUnitEnum {
  DAYS = "days",
  WEEKS = "weeks",
  MONTHS = "months",
  YEARS = "years"
}
export type RenewalPeriodUnit = RenewalPeriodUnitEnum | "days" | "weeks" | "months" | "years";

export interface RenewalPeriod {
  amount: number;
  unit: RenewalPeriodUnit;
}

export interface Price {
  amount: number;
  currency: Currency;
}

export interface Rating {
  value: number;
}

export enum Currency {
  EUR = "EUR",
  USD = "USD",
  GBP = "GBP",
}
