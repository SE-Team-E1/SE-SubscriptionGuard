import {Category, EntityId, Provider, Subscription} from "@/domain/subscriptionModel.ts";
import {Currency, RenewalPeriodUnitEnum} from "@/domain/domain.ts";
import {
  mapSubscriptionDTOtoEntity,
  mapSubscriptionEntityToDTO
} from "@/repository/subscriptions/mapper/subscriptionMapper";
import { ListSubscriptionService } from "@/feature/list/services/listSubscriptionService";
import {describe, test, expect, vi} from "vitest";
import {
  MockedCategoryRepository, MockedProviderRepository,
  MockedSubscriptionRepository
} from "@/repository/subscriptions/mockedRepositories.ts";
import type {
  RestCategoryDTO,
  RestProviderDTO,
  RestSubscriptionDTO
} from "@/repository/subscriptions/restRepositories.ts";

test("subscription object keeps integrity when transformed to dto and back", () => {
  const entity =  Subscription.create({
    name: "Subscription",
    provider: Provider.create("Subscription GmbH"),
    categories: [Category.create({name: "Category", icon: "icon-category"})],
    price: {
      amount: 112,
      currency: Currency.EUR
    },
    renewal: {
      amount: 2,
      unit: RenewalPeriodUnitEnum.MONTHS
    },
    bookingDate: new Date()
  })
  const dto = mapSubscriptionEntityToDTO(entity);
  const newEntity = mapSubscriptionDTOtoEntity(dto, entity.provider, [...entity.categories]);
  expect(newEntity).toStrictEqual(entity);
})

function createTestEntities(amount: number): Subscription[] {
  return [...Array(amount).keys()].map(i => {
    const provider = Provider.create(`Subscription ${i} GmbH`);
    const category = Category.create({name: `Category ${i}`, icon: `icon-category-${i}`});
    const subscription = Subscription.create({
        name: "Subscription " + i,
        price: {
          amount: i * 100,
          currency: Currency.EUR
        },
        categories: [category],
        provider: provider,
        bookingDate: new Date(),
        renewal: {
          amount: i,
          unit: RenewalPeriodUnitEnum.MONTHS
        }
      }
    )
    return subscription;
  })
}

function mapTestEntitiesToDTO(subscriptions: Subscription[]): {subscription: RestSubscriptionDTO, provider: RestProviderDTO, categories: RestCategoryDTO[]}[] {
  return subscriptions.map(s => {
    return {
      subscription: mapSubscriptionEntityToDTO(s),
      provider: {
        id: s.provider.id.value,
        name: s.provider.name
      },
      categories: s.categories.map(c => ({
        id: c.id.value,
        name: c.name,
        icon: c.icon
      }))
    }
  });
}

function mapDTOsToEntities(dtos: {subscription: RestSubscriptionDTO, provider: RestProviderDTO, categories: RestCategoryDTO[]}[]) {
  return dtos.map(dto => mapSubscriptionDTOtoEntity(
    dto.subscription,

    Provider.rehydrate({
      id: EntityId.fromString(dto.provider.id),
      name: dto.provider.name
    }),

    dto.categories.map(c =>
      Category.rehydrate({
        id: EntityId.fromString(c.id),
        name: c.name,
        icon: c.icon
      })
    )
  ));
}

describe("subscription list service", () => {

 test("returns empty list when no subscriptions were inserted", async () => {
    const service = new ListSubscriptionService(new MockedSubscriptionRepository(), new MockedCategoryRepository(), new MockedProviderRepository());
    await expect(service.execute()).resolves.toEqual({ subscriptions: [], issues: [] });
  })

  test("returns subscriptions that were inserted", async () => {

    const entities = createTestEntities(3);
    const dtos = mapTestEntitiesToDTO(entities);

    const subRepo = new MockedSubscriptionRepository(dtos.map(dto => dto.subscription));
    const catRepo = new MockedCategoryRepository(dtos.map(dto => dto.categories).flat());
    const provRepo = new MockedProviderRepository(dtos.map(dto => dto.provider));

    const service = new ListSubscriptionService(subRepo, catRepo, provRepo);
    await expect(service.execute()).resolves.toStrictEqual({ subscriptions: entities, issues: [] });
  })
})


 test.each([0, 1])('reports missing providers while keeping %i valid subscriptions', async (validCount) => {
   const dtos = mapTestEntitiesToDTO(createTestEntities(2));
   const service = new ListSubscriptionService(
     new MockedSubscriptionRepository(dtos.map(dto => dto.subscription)),
     new MockedCategoryRepository(dtos.flatMap(dto => dto.categories)),
     new MockedProviderRepository(dtos.slice(0, validCount).map(dto => dto.provider)),
   );
   const result = await service.execute();
   expect(result.subscriptions.map(sub => sub.id.value)).toEqual(dtos.slice(0, validCount).map(dto => dto.subscription.id));
   expect(result.issues).toEqual(dtos.slice(validCount).map(({subscription}) => ({
     subscriptionId: subscription.id,
     subscriptionName: subscription.name,
     providerId: subscription.providerId,
     reason: 'provider-missing',
   })));
 });

 test.each(['subscriptions', 'categories'] as const)('rejects when the %s request fails', async (source) => {
   const subscriptions = new MockedSubscriptionRepository();
   const providers = new MockedProviderRepository();
   const categories = new MockedCategoryRepository();
   const failure = new Error('Network unavailable');
   vi.spyOn(source === 'subscriptions' ? subscriptions : categories, 'findAll').mockRejectedValue(failure);
   const service = new ListSubscriptionService(subscriptions, categories, providers);
   await expect(service.execute()).rejects.toMatchObject({ message: 'Could not list subscriptions', cause: failure });
 });

 test('reports provider request failures per subscription and recovers on retry', async () => {
   const dtos = mapTestEntitiesToDTO(createTestEntities(2));
   const providers = new MockedProviderRepository(dtos.map(dto => dto.provider));
   vi.spyOn(providers, 'findAll').mockRejectedValueOnce(new Error('Network unavailable'));
   const service = new ListSubscriptionService(
     new MockedSubscriptionRepository(dtos.map(dto => dto.subscription)),
     new MockedCategoryRepository(dtos.flatMap(dto => dto.categories)),
     providers,
   );
   await expect(service.execute()).resolves.toEqual({
     subscriptions: [],
     issues: dtos.map(({subscription}) => ({
       subscriptionId: subscription.id,
       subscriptionName: subscription.name,
       providerId: subscription.providerId,
       reason: 'provider-load-failed',
     })),
   });
   const recovered = await service.execute();
   expect(recovered.subscriptions).toHaveLength(2);
   expect(recovered.issues).toEqual([]);
 });

 test('returns an empty result when providers fail but there are no subscriptions', async () => {
   const providers = new MockedProviderRepository();
   vi.spyOn(providers, 'findAll').mockRejectedValue(new Error('Network unavailable'));
   const service = new ListSubscriptionService(new MockedSubscriptionRepository(), new MockedCategoryRepository(), providers);
   await expect(service.execute()).resolves.toEqual({subscriptions: [], issues: []});
 });
