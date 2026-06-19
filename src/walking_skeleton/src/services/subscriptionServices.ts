import {
  Category, CategoryId,
  Provider,
  ProviderId,
  Subscription,
  SubscriptionId
} from "@/domain/subscriptionModel.ts";
import type {
  CategoryRepository, ProviderRepository,
  SubscriptionRepository
} from "@/repository/subscriptions/repositories.ts";
import type {
  RestProviderDTO,
  RestSubscriptionDTO
} from "@/repository/subscriptions/restRepositories.ts";

function mapSubscriptionDTOtoEntity(dto: RestSubscriptionDTO, provider: Provider, categories: Category[]): Subscription {
  return Subscription.rehydrate({
    id: SubscriptionId.fromString(dto.id),
    createdAt: new Date(dto.createdAt), // TODO discuss usage of Date type and which standard the response string follows

    name: dto.name,
    provider: provider,
    categories: categories,

    price: dto.price,
    bookingDate: new Date(dto.bookingDate),
    renewal: dto.renewal
  })
}

function mapSubscriptionEntityToDTO(subscription: Subscription): RestSubscriptionDTO {
  return {
    id: subscription.id.value,
    createdAt: subscription.createdAt.toISOString(),
    name: subscription.name,
    providerId: subscription.provider.id.value,
    categoriesId: subscription.categories.map(c => c.id.value),
    price: subscription.price,
    renewal: subscription.renewal,
    bookingDate: subscription.bookingDate.toISOString()
  }
}

function mapProviderEntityToDTO(provider: Provider): RestProviderDTO {
  return {
    id: provider.id.value,
    name: provider.name,
  }
}

function mapProviderDTOtoEntity(dto: RestProviderDTO): Provider {
  return Provider.rehydrate({
    id: ProviderId.fromString(dto.id),
    name: dto.name
  })
}

export class ListSubscriptionService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private categoryRepository: CategoryRepository,
    private providerRepository: ProviderRepository,
  ) {
  }
  async execute(): Promise<Subscription[]> {
    try{
      let dtos: RestSubscriptionDTO[] = await this.subscriptionRepository.findAll();
      const subscriptions: Subscription[] = [];

      const providerIds = [...new Set(dtos.map(dto => dto.providerId))];
      const categoryIds = [...new Set(dtos.map(dto => dto.categoriesId).flat())];

      const [providers, categories] = await Promise.all([
        this.providerRepository.findByIds(providerIds),
        this.categoryRepository.findByIds(categoryIds)
      ]);

      const providerMap = new Map<string, Provider>(
        providers.map(p => [p.id, Provider.rehydrate({id: ProviderId.fromString(p.id), name: p.name})])
      );
      const categoryMap = new Map<string, Category>(
        categories.map(c => [c.id, Category.rehydrate({id: CategoryId.fromString(c.id), name: c.name, icon: c.icon})])
      );

      return dtos.map(dto => {
        const provider = providerMap.get(dto.providerId);
        if (!provider) {
          throw new Error(`Provider data missing for id: ${dto.providerId}`);
        }
        const categories = dto.categoriesId
          .map(id => categoryMap.get(id))
          .filter((c): c is Category => !!c); // Strips away undefined balances safely;
        return mapSubscriptionDTOtoEntity(dto, provider, categories);
      })
    }
    catch(error) {
      throw new Error(`Could not list subscriptions`, { cause: error });
    }
  }
}

export class CreateSubscriptionService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
  ) {
  }
  async execute(subscription: Subscription): Promise<Subscription> {
    try{
      const createdSubscription = await this.subscriptionRepository.insert(mapSubscriptionEntityToDTO(subscription));
      return mapSubscriptionDTOtoEntity(
        createdSubscription,
        subscription.provider,
        [...subscription.categories]
      );
    }
    catch(error) {
      throw new Error(`Could not create subscription`, { cause: error });
    }
  }
}

export class CreateProviderService {
  constructor(
    private providerRepository: ProviderRepository,
  ) {
  }

  async execute(provider: Provider): Promise<Provider> {
    try {
      const createdProvider = await this.providerRepository.insert(mapProviderEntityToDTO(provider));
      return mapProviderDTOtoEntity(createdProvider);
    }
    catch (error) {
      throw new Error(`Could not create Provider`, { cause: error });
    }
  }
}
