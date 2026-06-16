import {type Category, Provider, Subscription} from "@/domain/subscriptionModel.ts";

export interface SubscriptionRepository {
  findAll(): Promise<Subscription[]>;
  insert(newSubscription: Subscription): Promise<Subscription>;
  update(subscription: Subscription): Promise<Subscription>;
}

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  insert(newCategory: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
}

export interface ProviderRepository {
  findAll(): Promise<Provider[]>;
  insert(newProvider: Provider): Promise<Provider>;
  update(provider: Provider): Promise<Provider>;
}
