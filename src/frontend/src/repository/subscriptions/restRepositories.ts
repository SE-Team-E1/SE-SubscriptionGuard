import {
  type CategoryRepository, type ProviderRepository,
  type SubscriptionRepository,
} from "@/repository/subscriptions/repositories.ts";
import {Category, Provider, Subscription, EntityId} from "@/domain/subscriptionModel.ts";
import type {Price, RenewalPeriod} from "@/domain/domain.ts";
import { tags } from "typia";
import { parseRestSubscriptionDTO, parseRestSubscriptionDTOs, parseRestCategoryDTO, parseRestCategoryDTOs, parseRestProviderDTO, parseRestProviderDTOs } from "./restDtoValidation.ts";

export interface RestSubscriptionDTO {
  id: string & tags.Format<'uuid'>,
  createdAt: string; // Datumsformat ISO-8601
  name: string;
  providerId: string
  categoriesId: string[];
  price: Price;
  renewal: RenewalPeriod;
  bookingDate: string; // Datumsformat ISO-8601
}

export interface RestCategoryDTO {
  id: string & tags.Format<'uuid'>,
  name: string,
  icon: string
}

export interface RestProviderDTO {
  id: string & tags.Format<'uuid'>,
  name: string
}

function mapSubscriptionDTOtoEntity(dto: RestSubscriptionDTO, provider: Provider, categories: Category[]): Subscription {
  return Subscription.rehydrate({
    id: EntityId.fromString(dto.id),
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

export class RestSubscriptionRepository implements SubscriptionRepository {
  constructor (
    // private providerRepository: ProviderRepository,
    // private categoryRepository: CategoryRepository,
  ) {}

  // private async hydratedSubscriptionEntityFromDTO(dto: RestSubscriptionDTO): Promise<Subscription> {
  //   let provider: Provider;
  //   let categories: Category[];
  //
  //   try {
  //     provider = await this.providerRepository.findById(dto.providerId);
  //     categories = await this.categoryRepository.findByIds(dto.categoriesId);
  //   } catch (error) {
  //     throw new Error(`Failed to hydrate subscription ${dto.id}: ${(error as Error).message}`);
  //   }
  //
  //   return mapSubscriptionDTOtoEntity(dto, provider, [...categories]);
  // }

  async findAll(): Promise<RestSubscriptionDTO[]> {
    let dtos: RestSubscriptionDTO[];
    try {
      const response = await fetch("/api/abos/?format=json")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const jsonResponse: unknown = await response.json();
      dtos = parseRestSubscriptionDTOs(jsonResponse);
      return dtos;

    } catch (error: any) {
      throw new Error(`Could not fetch subscriptions}`, {cause: error});
    }
  }

  async insert(newSubscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    try {
      const response = await fetch("/api/abos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSubscription),
      });
      if(!response.ok){
        throw new Error(`Could not create new Subscription. Request status: ${response.status}`);
      }

      const jsonResponse: unknown = await response.json();
      const dtoResult: RestSubscriptionDTO = parseRestSubscriptionDTO(jsonResponse);

      return dtoResult;


      // let subscription;
      // try {
      //   subscription = await this.hydratedSubscriptionEntityFromDTO(dtoResult);
      // }
      // catch (error) {
      //   throw new Error(`An error happened while retrieving server response: ${String(error)}`);
      // }
      //
      // return subscription;

    }catch(error: any) {
      throw new Error(
        `Could not create new Subscription`,
        { cause: error }
      );
    }
  }

  update(subscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    return Promise.reject("Not yet supported");
  }
}

export class RestCategoryRepository implements CategoryRepository {
  async findAll(): Promise<RestCategoryDTO[]> {
    let dtos: RestCategoryDTO[];
    try {
      const response = await fetch("/api/categories/?format=json")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const jsonResponse: unknown = await response.json();
      dtos = parseRestCategoryDTOs(jsonResponse);

      return dtos;

    } catch (error: any) {
      throw new Error(`Could not fetch subscriptions}`, {cause: error});
    }
  }

  findByIds(id: string[]): Promise<RestCategoryDTO[]> {
    return Promise.resolve([]);
  }

  insert(newCategory: RestCategoryDTO): Promise<RestCategoryDTO> {
    return Promise.reject("not yet implemented")
  }

  update(category: RestCategoryDTO): Promise<RestCategoryDTO> {
    return Promise.reject("not yet implemented");
  }
}

export class RestProviderRepository implements ProviderRepository {
  async findAll(): Promise<RestProviderDTO[]> {
    let dtos: RestProviderDTO[];
    try {
      const response = await fetch("/api/providers/?format=json")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const jsonResponse: unknown = await response.json();
      dtos = parseRestProviderDTOs(jsonResponse);
      return dtos;
    } catch (error: any) {
      throw new Error(`Could not fetch providers`, {cause: error});
    }
  }

  findByIds(id: string[]): Promise<RestProviderDTO[]> {
    return Promise.resolve([]);
  }

  insert(newProvider: RestProviderDTO): Promise<RestProviderDTO> {
    return Promise.reject("not yet implemented");
  }

  update(provider: RestProviderDTO): Promise<RestProviderDTO> {
    return Promise.reject("not yet implemented");
  }
}

