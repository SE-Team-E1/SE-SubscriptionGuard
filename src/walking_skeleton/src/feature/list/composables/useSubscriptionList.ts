import {inject, ref} from "vue";
import type {SubscriptionListItemDTO} from "@/feature/list/dto/ListDTO.ts";
import type {SubscriptionRepository} from "@/repository/SubscriptionRepository.ts";

export default function useSubscriptionList() {
  const list = ref<SubscriptionListItemDTO[]>([]);
  const repo: SubscriptionRepository = inject("subscriptionRepository") as SubscriptionRepository;

  const loadList = async() => {
    list.value = await repo.getSubscriptionList();
  }

  return {list, loadList};
}
