import type {Price, Rating, RenewalPeriod} from "../../../domain/domain.ts";


export interface SubscriptionListItemReponseDTO {
  id: string,
  name: string,
  provider: string,
  price: Price,
  renewalPeriod: RenewalPeriod,
  rating?: Rating,
}
