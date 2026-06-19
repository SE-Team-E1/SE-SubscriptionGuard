import {inject, ref} from "vue";
import {
  Currency,
  type Price,
  type RenewalPeriod,
  RenewalPeriodUnitEnum
} from "../../domain/domain.ts";
import type {
  ProviderRepository,
  SubscriptionRepository
} from "../../repository/subscriptions/repositories.ts";
import {
  CreateProviderService,
  CreateSubscriptionService
} from "@/services/subscriptionServices.ts";
import type {RestSubscriptionDTO} from "@/repository/subscriptions/restRepositories.ts";
import {Category, Provider} from "@/domain/subscriptionModel.ts";

export function useCreateSubscriptionService() {
  const subRepo: SubscriptionRepository = inject("subscriptionRepository") as SubscriptionRepository;
  return {service: new CreateSubscriptionService(subRepo)};
}

export function useCreateProviderService() {
  const providerRepo: ProviderRepository = inject("providerRepository") as ProviderRepository;
  return {service: new CreateProviderService(providerRepo) };
}

export function useListCategoriesService() {

}

export interface CreateSubscriptionViewDTO {
  name: string,
  provider: Provider;
  categories: Category[];
  price: Price;
  renewal: RenewalPeriod;
  bookingDate: Date;
}

export default function useSubscriptionCreation() {
  const newSubscription = ref({
    name: "",
    price: {
      amount: 0,
      currency: Currency.EUR
    },
    renewalPeriod: {
      amount: 1,
      unit: RenewalPeriodUnitEnum.MONTHS
    },
    startDate: "",
    provider: "",
    categories: []
  });
  const repository = inject<SubscriptionRepository>("subscriptionRepository") as SubscriptionRepository;
  const submitSubscription = async () => {
  }
  return {newSubscription, submitSubscription};
}
