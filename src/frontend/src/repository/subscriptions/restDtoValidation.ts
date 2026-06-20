import typia from "typia";
import type { RestProviderDTO, RestCategoryDTO, RestSubscriptionDTO } from "./restRepositories.ts";

// Provider Dto Validation
export const parseRestProviderDTOs = (input: unknown): RestProviderDTO[] =>
    typia.assert<RestProviderDTO[]>(input)

export const parseRestProviderDTO = (input: unknown): RestProviderDTO =>
    typia.assert<RestProviderDTO>(input)

// Category Dto Validation
export const parseRestCategoryDTOs = (input: unknown): RestCategoryDTO[] =>
    typia.assert<RestCategoryDTO[]>(input)

export const parseRestCategoryDTO = (input: unknown): RestCategoryDTO =>
    typia.assert<RestCategoryDTO>(input)

// Subscription Dto Validation
export const parseRestSubscriptionDTOs = (input: unknown): RestSubscriptionDTO[] =>
    typia.assert<RestSubscriptionDTO[]>(input)

export const parseRestSubscriptionDTO = (input: unknown): RestSubscriptionDTO =>
    typia.assert<RestSubscriptionDTO>(input)