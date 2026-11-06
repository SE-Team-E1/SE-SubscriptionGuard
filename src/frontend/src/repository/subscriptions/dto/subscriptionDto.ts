import type { Price, RenewalPeriod } from "@/domain/domain";
import { tags } from "typia";

export interface RestSubscriptionDTO {
    id: string & tags.Format<'uuid'>,
    createdAt: string; // Datumsformat ISO-8601
    name: string;
    providerId: string
    categoriesId: string[];
    price: Price;
    renewal: RenewalPeriod;
    bookingDate: string; // Datumsformat ISO-8601
}