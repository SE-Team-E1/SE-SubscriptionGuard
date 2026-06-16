import {inject, ref} from "vue";
import type {SubscriptionListItemReponseDTO} from "@/feature/list/dto/ListDTO.ts";
import type {
  CategoryRepository, ProviderRepository,
  SubscriptionRepository
} from "../../../repository/subscriptions/repositories.ts";
import type {Subscription} from "@/domain/subscriptionModel.ts";
import {ListSubscriptionService} from "@/services/subscriptionServices.ts";

function useListSubscriptionService() {
  const subRepo: SubscriptionRepository = inject("subscriptionRepository") as SubscriptionRepository;
  const catRepo: CategoryRepository = inject("categoryRepo") as CategoryRepository;
  const providerRepo: ProviderRepository = inject("providerRepository") as ProviderRepository;

  return {service: new ListSubscriptionService(subRepo, catRepo, providerRepo)};
}

export default function useSubscriptionList() {
  const list = ref<Subscription[]>([]);
  const {service} = useListSubscriptionService();

  const loadList = async() => {
    list.value = await service.execute();
  }

  return {list, loadList};
}
