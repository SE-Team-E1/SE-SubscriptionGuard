import type {
  CategoryRepository,
  ProviderRepository,
  SubscriptionRepository,
} from "./repositories.ts";
import { Category } from "@/domain/subscriptionModel.ts";
import type { RestCategoryDTO } from "./dto/categoryDto";
import type { RestProviderDTO } from "./dto/providerDto";
import type { RestSubscriptionDTO } from "./dto/subscriptionDto";
import { mdiMovie, mdiMusic, mdiHeartPulse } from "@mdi/js";

export class MockedSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: RestSubscriptionDTO[];

  constructor(initSubscriptions: RestSubscriptionDTO[] = []) {
    this.subscriptions = [...initSubscriptions];
  }

  findAll(): Promise<RestSubscriptionDTO[]> {
    return Promise.resolve([...this.subscriptions]);
  }

  insert(subscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    this.subscriptions.push(subscription);
    return Promise.resolve(subscription);
  }

  update(subscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    if (!this.subscriptions.some((item) => item.id === subscription.id)) {
      return Promise.reject(new Error(`Could not find subscription with id ${subscription.id}`));
    }
    return Promise.reject(new Error("Not yet supported"));
  }
}

export class MockedCategoryRepository implements CategoryRepository {
  private categories: RestCategoryDTO[] = [
    Category.create({ name: "Entertainment", icon: mdiMovie }),
    Category.create({ name: "Music", icon: mdiMusic }),
    Category.create({ name: "Health", icon: mdiHeartPulse }),
  ].map((category) => ({ id: category.id.value, name: category.name, icon: category.icon }));

  constructor(initCategories: RestCategoryDTO[] = []) {
    this.categories.push(...initCategories);
  }

  findAll(): Promise<RestCategoryDTO[]> {
    return Promise.resolve([...this.categories]);
  }

  insert(category: RestCategoryDTO): Promise<RestCategoryDTO> {
    this.categories.push(category);
    return Promise.resolve(category);
  }

  update(_category: RestCategoryDTO): Promise<RestCategoryDTO> {
    return Promise.reject(new Error("Not yet supported"));
  }

  findByIds(ids: string[]): Promise<RestCategoryDTO[]> {
    const found = ids.map((id) => this.categories.find((category) => category.id === id));
    if (found.some((category) => !category)) {
      return Promise.reject(new Error("Could not find category"));
    }
    return Promise.resolve(found as RestCategoryDTO[]);
  }
}

export class MockedProviderRepository implements ProviderRepository {
  private providers: RestProviderDTO[];

  constructor(initProviders: RestProviderDTO[] = []) {
    this.providers = [...initProviders];
  }

  findAll(): Promise<RestProviderDTO[]> {
    return Promise.resolve([...this.providers]);
  }

  findByIds(ids: string[]): Promise<RestProviderDTO[]> {
    const found = ids.map((id) => this.providers.find((provider) => provider.id === id));
    if (found.some((provider) => !provider)) {
      return Promise.reject(new Error("Could not find provider"));
    }
    return Promise.resolve(found as RestProviderDTO[]);
  }

  insert(provider: RestProviderDTO): Promise<RestProviderDTO> {
    this.providers.push(provider);
    return Promise.resolve(provider);
  }

  update(_provider: RestProviderDTO): Promise<RestProviderDTO> {
    return Promise.reject(new Error("Not yet supported"));
  }
}
