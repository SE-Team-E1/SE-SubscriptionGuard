import {type Currency, type Price, type RenewalPeriod} from "@/domain/domain.ts";

export interface Payment {
  id: string,
  subscriptionId: string,
  amount: number,
  date: string,
  currency: Currency,
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


export class Provider {
  constructor(
    private readonly _id: string,
    private _name: string,
  ) {
  }
}

type CategoryIcon = string

export class Category {
  constructor(
    private readonly _id: string,
    private _name: string,
    private _icon: CategoryIcon
  ) {
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get icon(): CategoryIcon {
    return this._icon;
  }
}

export class Subscription {
  private _contractEndDate: Date | null; // null => unlimited subscription

  constructor(
    private readonly _id: string,
    private _name: string,
    private _price: Price,
    private _renewal: RenewalPeriod,
    private readonly _bookingDate: Date,
    private readonly _createdDate: Date,
    private _provider: Provider,
    private _categories: Category[],
    contractEndDate?: Date
  ) {
    this._contractEndDate = contractEndDate ?? null;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get price(): Price {
    return this._price;
  }

  get renewal(): RenewalPeriod {
    return this._renewal;
  }

  get bookingDate(): Date {
    return this._bookingDate;
  }

  get createdDate(): Date {
    return this._createdDate;
  }

  get contractEndDate(): Date | null {
    return this._contractEndDate;
  }

  get provider(): Provider {
    return this._provider;
  }

  get categories(): readonly Category[] {
    return this._categories;
  }
}
