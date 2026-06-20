import {Category, EntityId, Provider, Subscription} from "@/domain/subscriptionModel.ts";
import {Currency, RenewalPeriodUnitEnum} from "@/domain/domain.ts";
import {
  ListSubscriptionService,
  mapSubscriptionDTOtoEntity,
  mapSubscriptionEntityToDTO
} from "@/services/subscriptionServices.ts";
import {describe, test, expect} from "vitest";
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

 test("returns empty list when no subscriptions were inserted", () => {
    const service = new ListSubscriptionService(new MockedSubscriptionRepository(), new MockedCategoryRepository(), new MockedProviderRepository());
    expect(service.execute()).resolves.toEqual([]);
  })

  test("returns subscriptions that were inserted", () => {

    const entities = createTestEntities(3);
    const dtos = mapTestEntitiesToDTO(entities);

    const subRepo = new MockedSubscriptionRepository(dtos.map(dto => dto.subscription));
    const catRepo = new MockedCategoryRepository(dtos.map(dto => dto.categories).flat());
    const provRepo = new MockedProviderRepository(dtos.map(dto => dto.provider));

    const service = new ListSubscriptionService(subRepo, catRepo, provRepo);
    expect(service.execute()).resolves.toStrictEqual(entities);
  })
})

