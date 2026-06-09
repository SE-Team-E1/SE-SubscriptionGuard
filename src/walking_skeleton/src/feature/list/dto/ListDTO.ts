import type {Price, Rating, RenewalPeriod} from "@/domain/domain.ts";


export interface SubscriptionListItemDTO {
  id: string,
  name: string,
  provider: string,
  price: Price,
  renewalPeriod: RenewalPeriod,
  rating?: Rating,
}
