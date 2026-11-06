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

let accessToken: string | undefined;
let loginRequest: Promise<string> | undefined;

const devCredentials = import.meta.env.DEV
  ? {
      username: import.meta.env.VITE_DEV_API_USERNAME,
      password: import.meta.env.VITE_DEV_API_PASSWORD,
    }
  : undefined;

async function loginForDevelopment(): Promise<string> {
  if (!devCredentials?.username || !devCredentials.password) {
    throw new Error("Local API credentials are not configured");
  }

  const response = await fetch("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(devCredentials),
  });
  if (!response.ok) {
    throw new Error(`Local API login failed (HTTP ${response.status})`);
  }

  const result: { access: string } = await response.json();
  accessToken = result.access;
  return accessToken;
}

async function getAccessToken(): Promise<string | undefined> {
  if (accessToken) return accessToken;
  if (!devCredentials?.username || !devCredentials.password) return undefined;

  loginRequest ??= loginForDevelopment();
  try {
    return await loginRequest;
  } finally {
    loginRequest = undefined;
  }
}

async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(input, { ...init, headers });
  if (response.status === 401 && devCredentials?.username && devCredentials.password) {
    accessToken = undefined;
    const refreshedToken = await loginForDevelopment();
    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
    response = await fetch(input, { ...init, headers: retryHeaders });
  }
  return response;
}

export class RestSubscriptionRepository implements SubscriptionRepository {

  async findAll(): Promise<RestSubscriptionDTO[]> {
    let dtos: RestSubscriptionDTO[];
    try {
      const response = await authorizedFetch("/api/subscriptions/?format=json")
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
      const apiPayload = {
        ...newSubscription,
        bookingDate: newSubscription.bookingDate.slice(0, 10),
      };
      const response = await authorizedFetch("/api/subscriptions/", {
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

  update(subscription: RestSubscriptionDTO): Promise<RestSubscriptionDTO> {
    return Promise.reject("Not yet supported");
  }
}

export class RestCategoryRepository implements CategoryRepository {
  async findAll(): Promise<RestCategoryDTO[]> {
    let dtos: RestCategoryDTO[];
    try {
      const response = await authorizedFetch("/api/categories/?format=json")
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

  async insert(newCategory: RestCategoryDTO): Promise<RestCategoryDTO> {
    try {
      const response = await authorizedFetch("/api/categories/", {
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

  update(category: RestCategoryDTO): Promise<RestCategoryDTO> {
    return Promise.reject("not yet implemented");
  }
}

export class RestProviderRepository implements ProviderRepository {
  async findAll(): Promise<RestProviderDTO[]> {
    let dtos: RestProviderDTO[];
    try {
      const response = await authorizedFetch("/api/providers/?format=json")
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

  async insert(newProvider: RestProviderDTO): Promise<RestProviderDTO> {
    try {
      const response = await authorizedFetch("/api/providers/", {
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

  update(provider: RestProviderDTO): Promise<RestProviderDTO> {
    return Promise.reject("not yet implemented");
  }
}
