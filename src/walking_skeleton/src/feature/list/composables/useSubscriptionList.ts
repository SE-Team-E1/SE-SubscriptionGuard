import {inject, ref} from "vue";
import type {SubscriptionListItemReponseDTO} from "@/feature/list/dto/ListDTO.ts";
import type {SubscriptionRepository} from "@/repository/SubscriptionRepository.ts";

export default function useSubscriptionList() {
  const list = ref<SubscriptionListItemReponseDTO[]>([]);
  const repo: SubscriptionRepository = inject("subscriptionRepository") as SubscriptionRepository;

  const loadList = async() => {
    list.value = await repo.getSubscriptionList();
  }

  return {list, loadList};
}
