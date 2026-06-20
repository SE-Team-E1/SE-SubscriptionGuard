import type { Price, RenewalPeriod } from "@/domain/domain";
import type { Category } from "@/domain/subscriptionModel";
import type { ProviderAddDto } from "./providerAddDto";

export interface SubscriptionAddDto {
    name: string;
    provider: ProviderAddDto;
    categories: Category[];
    price: Price;
    renewal: RenewalPeriod;
    bookingDate: string;
}