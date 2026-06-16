import type {
  CategoryRepository,
  ProviderRepository,
  SubscriptionRepository
} from "./repositories.ts";
import {Category, Provider, type Subscription} from "@/domain/subscriptionModel.ts";

export class MockedSubscriptionRepository implements SubscriptionRepository{
  private subscriptions: Subscription[] = [];

  findAll(): Promise<Subscription[]> {
    return Promise.resolve([...this.subscriptions]);
  }

  insert(newSubscription: Subscription): Promise<Subscription> {
    this.subscriptions.push(newSubscription);
    return Promise.resolve(newSubscription);
  }

  update(subscription: Subscription): Promise<Subscription> {
    let subscriptionToUpdate = this.subscriptions.find(s => s.id.value === subscription.id.value);
    if(subscriptionToUpdate) {
      // TODO when editing is supported
      return Promise.reject("not yet supported");
      //return Promise.resolve(subscriptionToUpdate);
    }
    return Promise.reject(new Error("Could not find subscription with id " + subscription.id.value));
  }
}

export class MockedCategoryRepository implements CategoryRepository {
  private categories : Category[] = [
    Category.create({name: "Entertainment", icon:""}),
    Category.create({name: "Music", icon:""}),
    Category.create({name: "Health", icon: ""})
  ]

  findAll(): Promise<Category[]> {
    return Promise.resolve([...this.categories]);
  }

  insert(newCategory: Category): Promise<Category> {
    return Promise.reject("not yet supported");
  }

  update(category: Category): Promise<Category> {
    return Promise.reject("not yet supported");
  }
}

export class MockedProviderRepository implements ProviderRepository {
  private providers : Provider[] = []

  findAll(): Promise<Provider[]> {
    return Promise.resolve([...this.providers]);
  }

  insert(newProvider: Provider): Promise<Provider> {
    this.providers.push(newProvider);
    return Promise.resolve(newProvider);
  }

  update(provider: Provider): Promise<Provider> {
    return Promise.reject("not yet supported");
  }

}
