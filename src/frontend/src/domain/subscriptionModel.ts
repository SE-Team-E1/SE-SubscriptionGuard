import {type Price, type RenewalPeriod} from "./domain.ts";

export class EntityId {
  private constructor(readonly value: string) {
    if (!EntityId.isValidUuid(value)) {
      throw new Error(`Invalid id: ${value}`)
    }
  }
  static new(): EntityId {
    return new EntityId(crypto.randomUUID());
  }
  private static isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  }

  static fromString(value: string): EntityId {
    return new EntityId(value);
  }
}


export class Provider {
  constructor(
    readonly id: EntityId,
    readonly name: string,
  ) {
  }

  /**
   * Create a new provider. Will generate id.
   * @param name
   */
  static create(name: string): Provider {
    return new Provider(EntityId.new(), name);
  }

  /**
   * Create a new Provider object from persisted data.
   * @param props
   */
  static rehydrate(props: {id: EntityId, name: string}) {
    return new Provider(props.id, props.name);
  }
}

export type CategoryIcon = string

export class Category {
  readonly id: EntityId;
  readonly name: string;
  readonly icon: CategoryIcon;

  private constructor(id: EntityId, name: string, icon: CategoryIcon) {
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
    return new Category(EntityId.new(), props.name, props.icon);
  }

  /**
   * Create a new Category object from persisted data.
   * @param props
   */
  static rehydrate(props: {id: EntityId, name: string, icon: CategoryIcon}): Category {
    return new Category(props.id, props.name, props.icon);
  }
}

export class Subscription {
  readonly id: EntityId;
  readonly name: string;
  readonly createdAt: Date;
  readonly provider: Provider;
  readonly categories: readonly Category[];
  readonly price: Price;
  readonly renewal: RenewalPeriod;
  readonly bookingDate: Date;

  private constructor(props: {
    id: EntityId;
    createdAt: Date;

    name: string
    provider: Provider;
    categories: Category[];

    price: Price;
    renewal: RenewalPeriod;
    bookingDate: Date;
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
    bookingDate: Date;
  }): Subscription {
    return new Subscription({
      id: EntityId.new(),
      createdAt: new Date(),
      ...params,
    });
  }

  /**
   * Create a new Subscription object from persisted data.
   * @param params
   */
  static rehydrate(params: {
    id: EntityId;
    createdAt: Date;
    name: string
    provider: Provider;
    categories: Category[];
    price: Price;
    renewal: RenewalPeriod;
    bookingDate: Date;
  }): Subscription {
    return new Subscription(params);
  }
}
