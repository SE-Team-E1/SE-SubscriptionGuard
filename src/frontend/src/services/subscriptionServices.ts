import {
  Category,
  Provider,
  Subscription,
  EntityId
} from "@/domain/subscriptionModel.ts";
import type {
  CategoryRepository, ProviderRepository,
  SubscriptionRepository
} from "@/repository/subscriptions/repositories.ts";
import type { RestSubscriptionDTO } from "@/repository/subscriptions/dto/subscriptionDto";
import { mapSubscriptionDTOtoEntity } from "@/repository/subscriptions/mapper/subscriptionMapper";

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

      const [providers, categories] = await Promise.all([
        this.providerRepository.findAll(),
        this.categoryRepository.findAll()
      ]);

      const providerMap = new Map<string, Provider>(
        providers.map(p => [p.id, Provider.rehydrate({id: EntityId.fromString(p.id), name: p.name})])
      );
      const categoryMap = new Map<string, Category>(
        categories.map(c => [c.id, Category.rehydrate({id: EntityId.fromString(c.id), name: c.name, icon: c.icon})])
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
