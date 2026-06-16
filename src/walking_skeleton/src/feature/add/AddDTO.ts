import type {Price, Rating, RenewalPeriod} from "../../domain/domain.ts";

export interface CreateSubscriptionRequestDTO {
  name: string;
  price: Price;
  /**
   * Abo-Abschluss, standardisiert
   */
  startDate: string,
  provider: string,
  renewalPeriod: RenewalPeriod,
  categories: string[],
}
