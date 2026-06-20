import type { Price, RenewalPeriod } from "@/domain/domain";
import type { Category } from "@/domain/subscriptionModel";

export interface SubscriptionAddDto {
    name: string;
    providerId: string;
    categories: Category[];
    price: Price;
    renewal: RenewalPeriod;
    bookingDate: string;
}