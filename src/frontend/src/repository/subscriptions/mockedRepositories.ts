import type {
  CategoryRepository,
  ProviderRepository,
  SubscriptionRepository
} from "./repositories.ts";
import {Category, Provider, type Subscription} from "@/domain/subscriptionModel.ts";
import type {
  RestCategoryDTO, RestProviderDTO,
  RestSubscriptionDTO
} from "@/repository/subscriptions/restRepositories.ts";
import {id} from "vuetify/locale";

export class MockedSubscriptionRepository implements SubscriptionRepository{
  private subscriptions: RestSubscriptionDTO[] = [];

  findAll(): Promise<RestSubscriptionDTO[]> {
    return Promise.resolve([...this.subscriptions]);
  }

  insert(newSubscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    this.subscriptions.push(newSubscription);
    return Promise.resolve(newSubscription);
  }

  update(subscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    let subscriptionToUpdate = this.subscriptions.find(s => s.id === subscription.id);
    if(subscriptionToUpdate) {
      // TODO when editing is supported
      return Promise.reject("not yet supported");
      //return Promise.resolve(subscriptionToUpdate);
    }
    return Promise.reject(new Error("Could not find subscription with id " + subscription.id));
  }
}

export class MockedCategoryRepository implements CategoryRepository {
  private categories : RestCategoryDTO[] = [
    Category.create({name: "Entertainment", icon:""}),
    Category.create({name: "Music", icon:""}),
    Category.create({name: "Health", icon: ""})
  ].map(c => ({id: c.id.value, name: c.name, icon: c.icon}));

  findAll(): Promise<RestCategoryDTO[]> {
    return Promise.resolve([...this.categories]);
  }

  insert(newCategory: RestCategoryDTO): Promise<RestCategoryDTO> {
    return Promise.reject("not yet supported");
  }

  update(category: RestCategoryDTO): Promise<RestCategoryDTO> {
    return Promise.reject("not yet supported");
  }

  findByIds(id: string[]): Promise<RestCategoryDTO[]> {
    let success = true;
    let categoriesFound = id.map(id => {
      let categoryFound = this.categories.find(c => c.id === id);
      if(categoryFound) {
        return categoryFound;
      }
      success = false;
    })
    if(success) {
      return Promise.resolve(categoriesFound as RestCategoryDTO[]);
    }
    return Promise.reject("Could not find category");
  }
}

export class MockedProviderRepository implements ProviderRepository {
  private providers : RestProviderDTO[] = []

  findAll(): Promise<RestProviderDTO[]> {
    return Promise.resolve([...this.providers]);
  }


  findByIds(id: string[]): Promise<RestProviderDTO[]> {
    let success = true;
    let providersFound = id.map(id => {
      let providerFound = this.providers.find(c => c.id === id);
      if(providerFound) {
        return providerFound;
      }
      success = false;
    })
    if(success) {
      return Promise.resolve(providersFound as RestCategoryDTO[]);
    }
    return Promise.reject("Could not find provider");
  }

  insert(newProvider: RestProviderDTO): Promise<RestProviderDTO> {
    this.providers.push(newProvider);
    return Promise.resolve(newProvider);
  }

  update(provider: RestProviderDTO): Promise<RestProviderDTO> {
    return Promise.reject("not yet supported");
  }
}
