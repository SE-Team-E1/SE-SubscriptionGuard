import type {CreateSubscriptionRequestDTO} from "@/feature/add/AddDTO.ts";
import {inject, ref} from "vue";
import {Currency, RenewalPeriodUnitEnum} from "@/domain/domain.ts";
import type {SubscriptionRepository} from "@/repository/SubscriptionRepository.ts";

export default function useSubscriptionCreation() {
  const newSubscription = ref<CreateSubscriptionRequestDTO>({
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
    await repository.createSubscription(newSubscription.value);
  }
  return {newSubscription, submitSubscription};
}
