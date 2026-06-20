import {describe, expect, test, it} from 'vitest'
import {
  MockedCategoryRepository,
  MockedProviderRepository,
  MockedSubscriptionRepository
} from "@/repository/subscriptions/mockedRepositories.ts";
import type { RestCategoryDTO } from "./dto/categoryDto";
import type { RestProviderDTO } from "./dto/providerDto";
import type { RestSubscriptionDTO } from "./dto/subscriptionDto";
import {Currency, RenewalPeriodUnitEnum} from "@/domain/domain.ts";

function createTestSubscriptionDTO(amount: number): RestSubscriptionDTO[] {
  return [...Array(amount).keys()].map(i => ({
    id: i.toString(),
    createdAt: new Date().toISOString(),
    name: "Subscription " + i,
    price: {
      amount: i * 100,
      currency: Currency.EUR
    },
    categoriesId: [],
    providerId: i.toString(),
    bookingDate: new Date().toISOString(),
    renewal:{
      amount: i,
      unit: RenewalPeriodUnitEnum.MONTHS
    }
  }));
}

function createTestProviderDTO(amount: number) : RestProviderDTO[] {
  return [...Array(amount).keys()].map(i => ({
    id: i.toString(),
    name: "Provider " + i
  }))
}

function createTestCategoryDTO(amount: number) : RestCategoryDTO[] {
  return [...Array(amount).keys()].map(i => ({
    id: i.toString(),
    name: "Category " + i,
    icon: "icon-category-" + i
  }))
}

describe("mocked subscription repository", () => {
  test("finds no subscriptions if none were inserted", async () => {
    const repository = new MockedSubscriptionRepository();
    const subscriptions = await repository.findAll();
    expect(subscriptions).toEqual([]);
  })
  test("finds all subscriptions that were inserted", async () => {
    const repository = new MockedSubscriptionRepository();
    let testDTOs = createTestSubscriptionDTO(3)

    for(let dto of testDTOs) {
      let insertRes  = await repository.insert(dto);
      expect(insertRes).toEqual(dto);
    }

    let findAllRes = await repository.findAll();
    expect(testDTOs).toEqual(findAllRes);
  })
})

describe("mocked provider repository", () => {
  test("finds no providers if none were inserted", async () => {
    const repository = new MockedProviderRepository();
    const providers = await repository.findAll();
    expect(providers).toEqual([]);
  })
  test("finds no provider by id if no matching provider was inserted", async () => {
    const repository = new MockedProviderRepository();
    await expect(repository.findByIds(["123"])).rejects.toThrow();
  })
  test("finds providers by id that were inserted", async () => {
    const repository = new MockedProviderRepository();
    let testDTOs = createTestProviderDTO(3)

    for(let dto of testDTOs) {
      let insertRes  = await repository.insert(dto);
      expect(insertRes).toEqual(dto);
    }

    const dtosToFind = testDTOs.slice(0,3)
    let findIdsRes = await repository.findByIds(dtosToFind.map(dto => dto.id));
    expect(findIdsRes).toEqual(dtosToFind);
  })
  test("finds all providers that were inserted", async () => {
    const repository = new MockedProviderRepository();
    let testDTOs = createTestProviderDTO(3)

    for(let dto of testDTOs) {
      let insertRes  = await repository.insert(dto);
      expect(insertRes).toEqual(dto);
    }

    let findAllRes = await repository.findAll();
    expect(testDTOs).toEqual(findAllRes);
  })
})

describe("mocked category repository", () => {
  test("finds default categories", async () => {
    const repository = new MockedCategoryRepository();
    const categories:RestCategoryDTO[] = await repository.findAll();
    expect(categories).not.toEqual([])
  })
  it.skip("finds no category by id if no matching category was inserted", async () => {
    const repository = new MockedCategoryRepository();
    await expect(repository.findByIds(["123"])).rejects.toThrow();
  })
  it.skip("finds categories by id that were inserted", async () => {
    const repository = new MockedCategoryRepository();
    let testDTOs = createTestCategoryDTO(3)

    for(let dto of testDTOs) {
      let insertRes  = await repository.insert(dto);
      expect(insertRes).toEqual(dto);
    }

    const dtosToFind = testDTOs.slice(0,3)
    let findIdsRes = await repository.findByIds(dtosToFind.map(dto => dto.id));
    expect(findIdsRes).toEqual(dtosToFind);
  })
  it.skip("finds all categories that were inserted", async () => {
    const repository = new MockedCategoryRepository();
    let testDTOs = createTestCategoryDTO(3)

    for(let dto of testDTOs) {
      let insertRes  = await repository.insert(dto);
      expect(insertRes).toEqual(dto);
    }

    let findAllRes = await repository.findAll();
    expect(testDTOs).toEqual(findAllRes);
  })
})
