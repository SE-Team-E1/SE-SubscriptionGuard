import {
  type CategoryRepository, type ProviderRepository,
  type SubscriptionRepository,
} from "@/repository/subscriptions/repositories.ts";
import type { RestSubscriptionDTO } from "./dto/subscriptionDto";
import type { RestCategoryDTO } from "./dto/categoryDto";
import type { RestProviderDTO } from "./dto/providerDto";
import { parseRestSubscriptionDTO, parseRestSubscriptionDTOs, parseRestCategoryDTO, parseRestCategoryDTOs, parseRestProviderDTO, parseRestProviderDTOs } from "./restDtoValidation.ts";

export type { RestSubscriptionDTO } from "./dto/subscriptionDto";
export type { RestCategoryDTO } from "./dto/categoryDto";
export type { RestProviderDTO } from "./dto/providerDto";

export type AccessTokenProvider = () => string | undefined;

// The token is read per request, so a new login takes effect without recreating the repository.
async function authorizedFetch(
  getAccessToken: AccessTokenProvider,
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export class RestSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly getAccessToken: AccessTokenProvider) {}

  async findAll(): Promise<RestSubscriptionDTO[]> {
    let dtos: RestSubscriptionDTO[];
    try {
      const response = await authorizedFetch(this.getAccessToken, "/api/subscriptions/?format=json")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const jsonResponse: unknown = await response.json();
      dtos = parseRestSubscriptionDTOs(jsonResponse);
      return dtos;

    } catch (error: any) {
      throw new Error(`Could not fetch subscriptions`, {cause: error});
    }
  }

  async insert(newSubscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    try {
      const apiPayload = {
        ...newSubscription,
        bookingDate: newSubscription.bookingDate.slice(0, 10),
      };
      const response = await authorizedFetch(this.getAccessToken, "/api/subscriptions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
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

  update(_subscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    return Promise.reject("Not yet supported");
  }
}

export class RestCategoryRepository implements CategoryRepository {
  constructor(private readonly getAccessToken: AccessTokenProvider) {}

  async findAll(): Promise<RestCategoryDTO[]> {
    let dtos: RestCategoryDTO[];
    try {
      const response = await authorizedFetch(this.getAccessToken, "/api/categories/?format=json")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const jsonResponse: unknown = await response.json();
      dtos = parseRestCategoryDTOs(jsonResponse);

      return dtos;

    } catch (error: any) {
      throw new Error(`Could not fetch categories`, {cause: error});
    }
  }

  findByIds(_ids: string[]): Promise<RestCategoryDTO[]> {
    return Promise.resolve([]);
  }

  async insert(newCategory: RestCategoryDTO): Promise<RestCategoryDTO> {
    try {
      const response = await authorizedFetch(this.getAccessToken, "/api/categories/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const jsonResponse: unknown = await response.json();
      return parseRestCategoryDTO(jsonResponse);
    } catch (error) {
      throw new Error("Could not create category", { cause: error });
    }
  }

  update(_category: RestCategoryDTO): Promise<RestCategoryDTO> {
    return Promise.reject("not yet implemented");
  }
}

export class RestProviderRepository implements ProviderRepository {
  constructor(private readonly getAccessToken: AccessTokenProvider) {}

  async findAll(): Promise<RestProviderDTO[]> {
    let dtos: RestProviderDTO[];
    try {
      const response = await authorizedFetch(this.getAccessToken, "/api/providers/?format=json")
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

  findByIds(_ids: string[]): Promise<RestProviderDTO[]> {
    return Promise.resolve([]);
  }

  async insert(newProvider: RestProviderDTO): Promise<RestProviderDTO> {
    try {
      const response = await authorizedFetch(this.getAccessToken, "/api/providers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProvider),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const jsonResponse: unknown = await response.json();
      return parseRestProviderDTO(jsonResponse);
    } catch (error) {
      throw new Error("Could not create provider", { cause: error });
    }
  }

  update(_provider: RestProviderDTO): Promise<RestProviderDTO> {
    return Promise.reject("not yet implemented");
  }
}
