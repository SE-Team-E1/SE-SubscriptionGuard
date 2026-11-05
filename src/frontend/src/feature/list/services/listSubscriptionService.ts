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

export type SubscriptionListIssue = {
  subscriptionId: string;
  subscriptionName: string;
  providerId: string;
  reason: 'provider-missing' | 'provider-load-failed';
};

export type ListSubscriptionsResult = {
  subscriptions: Subscription[];
  issues: SubscriptionListIssue[];
};

export class ListSubscriptionService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private categoryRepository: CategoryRepository,
    private providerRepository: ProviderRepository,
  ) {
  }
  async execute(): Promise<ListSubscriptionsResult> {
    try{
      const dtos: RestSubscriptionDTO[] = await this.subscriptionRepository.findAll();

      const [providerResult, categoryResult] = await Promise.allSettled([
        this.providerRepository.findAll(),
        this.categoryRepository.findAll()
      ]);

      if (categoryResult.status === 'rejected') {
        throw categoryResult.reason;
      }
      const providers = providerResult.status === 'fulfilled' ? providerResult.value : [];
      const categories = categoryResult.value;

      const providerMap = new Map<string, Provider>(
        providers.map(p => [p.id, Provider.rehydrate({id: EntityId.fromString(p.id), name: p.name})])
      );
      const categoryMap = new Map<string, Category>(
        categories.map(c => [c.id, Category.rehydrate({id: EntityId.fromString(c.id), name: c.name, icon: c.icon})])
      );

      const subscriptions: Subscription[] = [];
      const issues: SubscriptionListIssue[] = [];
      for (const dto of dtos) {
        const provider = providerMap.get(dto.providerId);
        if (!provider) {
          issues.push({
            subscriptionId: dto.id,
            subscriptionName: dto.name,
            providerId: dto.providerId,
            reason: providerResult.status === 'rejected' ? 'provider-load-failed' : 'provider-missing',
          });
          continue;
        }
        const categories = dto.categoriesId
          .map(id => categoryMap.get(id))
          .filter((c): c is Category => !!c); // Strips away undefined balances safely;
        subscriptions.push(mapSubscriptionDTOtoEntity(dto, provider, categories));
      }
      return { subscriptions, issues };
    }
    catch(error) {
      throw new Error(`Could not list subscriptions`, { cause: error });
    }
  }
}
