import {type Price, type RenewalPeriod} from "./domain.ts";

class ProviderId {
  private constructor(readonly value: string) {}
  static new(): ProviderId {
    return new ProviderId(crypto.randomUUID());
  }
}

export class Provider {
  constructor(
    readonly id: ProviderId,
    readonly name: string,
  ) {
  }

  /**
   * Create a new provider. Will generate id.
   * @param name
   */
  static create(name: string): Provider {
    return new Provider(ProviderId.new(), name);
  }

  /**
   * Create a new Provider object from persisted data.
   * @param props
   */
  static rehydrate(props: {id: ProviderId, name: string}) {
    return new Provider(props.id, props.name);
  }
}

export type CategoryIcon = string

class CategoryId {
  private constructor(readonly value: string) {}

  static new(): CategoryId {
    return new CategoryId(crypto.randomUUID());
  }
}

export class Category {
  readonly id: CategoryId;
  readonly name: string;
  readonly icon: CategoryIcon;

  private constructor(id: CategoryId, name: string, icon: CategoryIcon) {
    if (!name.trim()) {
      throw new Error("Category name cannot be empty");
    }
    this.id = id;
    this.name = name;
    this.icon = icon;
  }

  /**
   * Create a new Category. Will generate id.
   * @param props
   */
  static create(props: {name: string, icon: CategoryIcon}): Category {
    return new Category(CategoryId.new(), props.name, props.icon);
  }

  /**
   * Create a new Category object from persisted data.
   * @param props
   */
  static rehydrate(props: {id: CategoryId, name: string, icon: CategoryIcon}): Category {
    return new Category(props.id, props.name, props.icon);
  }
}

/*
Subscription
 */

export class SubscriptionId {
  private constructor(readonly value: string) {}

  static new(): SubscriptionId {
    return new SubscriptionId(crypto.randomUUID());
  }
}

interface BookingDate {

}

export class Subscription {
  readonly id: SubscriptionId;
  readonly name: string;
  readonly createdAt: Date;
  readonly provider: Provider;
  readonly categories: readonly Category[];
  readonly price: Price;
  readonly renewal: RenewalPeriod;
  readonly bookingDate: BookingDate;

  private constructor(props: {
    id: SubscriptionId;
    createdAt: Date;

    name: string
    provider: Provider;
    categories: Category[];

    price: Price;
    renewal: RenewalPeriod;
    bookingDate: BookingDate;
  }) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.name = props.name;
    this.provider = props.provider;
    this.categories = Object.freeze([...props.categories]);
    this.price = props.price;
    this.renewal = props.renewal;
    this.bookingDate = props.bookingDate;
  }

  /**
   * Create a new Subscription. Will generate id and createdDate
   * @param params
   */
  static create(params: {
    name: string,
    provider: Provider;
    categories: Category[];
    price: Price;
    renewal: RenewalPeriod;
    bookingDate: BookingDate;
  }): Subscription {
    return new Subscription({
      id: SubscriptionId.new(),
      createdAt: new Date(),
      ...params,
    });
  }

  /**
   * Create a new Subscription object from persisted data.
   * @param params
   */
  static rehydrate(params: {
    id: SubscriptionId;
    createdAt: Date;
    name: string
    provider: Provider;
    categories: Category[];
    price: Price;
    renewal: RenewalPeriod;
    bookingDate: BookingDate;
  }): Subscription {
    return new Subscription(params);
  }
}
