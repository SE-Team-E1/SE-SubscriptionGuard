import type {
  RestCategoryDTO, RestProviderDTO,
  RestSubscriptionDTO
} from "@/repository/subscriptions/restRepositories.ts";

export interface SubscriptionRepository {
  findAll(): Promise<RestSubscriptionDTO[]>;
  insert(newSubscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO>;
  update(subscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO>;
}

export interface CategoryRepository {
  findAll(): Promise<RestCategoryDTO[]>;
  findByIds(id: string[]): Promise<RestCategoryDTO[]>;
  insert(newCategory: RestCategoryDTO): Promise<RestCategoryDTO>;
  update(category: RestCategoryDTO): Promise<RestCategoryDTO>;
}

export interface ProviderRepository {
  findAll(): Promise<RestProviderDTO[]>;
  findByIds(id: string[]): Promise<RestProviderDTO[]>;
  insert(newProvider: RestProviderDTO): Promise<RestProviderDTO>;
  update(provider: RestProviderDTO): Promise<RestProviderDTO>;
}
