import {computed, inject, ref} from "vue";
import type {
  CategoryRepository, ProviderRepository,
  SubscriptionRepository
} from "../../../repository/subscriptions/repositories.ts";
import type {Subscription} from "@/domain/subscriptionModel.ts";
import {ListSubscriptionService, type SubscriptionListIssue} from "@/feature/list/services/listSubscriptionService";

function useListSubscriptionService() {
  const subRepo: SubscriptionRepository = inject("subscriptionRepository") as SubscriptionRepository;
  const catRepo: CategoryRepository = inject("categoryRepository") as CategoryRepository;
  const providerRepo: ProviderRepository = inject("providerRepository") as ProviderRepository;

  return {service: new ListSubscriptionService(subRepo, catRepo, providerRepo)};
}

export default function useSubscriptionList() {
  const list = ref<Subscription[]>([]);
  const issues = ref<SubscriptionListIssue[]>([]);
  const providerLoadFailed = computed(() => issues.value.some(issue => issue.reason === 'provider-load-failed'));
  const isLoading = ref(false);
  const hasError = ref(false);
  const {service} = useListSubscriptionService();

  const loadList = async() => {
    isLoading.value = true;
    hasError.value = false;
    issues.value = [];
    try {
      const result = await service.execute();
      list.value = result.subscriptions;
      issues.value = result.issues;
    } catch {
      list.value = [];
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {list, issues, providerLoadFailed, isLoading, hasError, loadList};
}
