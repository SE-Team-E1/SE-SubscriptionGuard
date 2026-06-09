import type {Currency} from "@/domain/domain.ts";

export interface Payment {
    id: string,
    subscriptionId: string,
    amount: number,
    date: string,
    currency: Currency,
    // version: number, // for OCC sync
}

export interface Provider {
    id: string,
    name: string,
    url: string
    // version: number, // for OCC sync
}

export interface Category {
    id: string,
    // userId: string, // not needed for now as just user related data will be fetched. Interesting for multi-user, maybe for sync needed
    label: string,
    icon: string,
    // version: number, // for OCC sync
}

export enum DeliveryStatus {
    PENDING = "PENDING",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
}

export interface Reminder {
    id: string,
    subscriptionId: string,
    content: string,
    dueDate: string,
    deliveryStatus: DeliveryStatus,
    // version: number, // for OCC sync
}

export interface Subscription {
    id: string,
    // userId: string, // not needed for now as just user related data will be fetched. Interesting for multi-user, maybe for sync needed
    name: string,
    price: number,
    currency: Currency,
    renewal: string, // billing cycle e.g. 1 month, 1 year, etc.
    bookingDate: string,
    cancellationPeriod: string, // time before contractEndDate to cancel the subscription
    contractEndDate: string,
    providerId: string,
    categoryIds: string[],
    // version: number, // for OCC sync
}
