import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import { AddSubscriptionService } from '@/feature/add/service/addSubscriptionService'
import type { CategoryAddDto } from '@/feature/add/dto/categoryAddDto'
import type { CategoryRepository, ProviderRepository, SubscriptionRepository } from '@/repository/subscriptions/repositories'
import { Currency, RenewalPeriodUnitEnum } from '@/domain/domain'
import type { Category, Provider } from '@/domain/subscriptionModel'

const MAX_PROVIDER_HINTS = 6

function levenshtein(a: string, b: string): number {
  const n = b.length
  const previous = Array.from({ length: n + 1 }, () => 0)
  const current = Array.from({ length: n + 1 }, () => 0)

  for (let j = 0; j <= n; j++) {
    previous[j] = j
  }

  for (let i = 1; i <= a.length; i++) {
    current[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const deletion = (previous[j] ?? 0) + 1
      const insertion = (current[j - 1] ?? 0) + 1
      const substitution = (previous[j - 1] ?? 0) + cost
      current[j] = Math.min(deletion, insertion, substitution)
    }
    for (let j = 0; j <= n; j++) {
      previous[j] = current[j] ?? 0
    }
  }

  return previous[n] ?? n
}

function providerRank(name: string, query: string) {
  const n = name.toLowerCase()
  const q = query.trim().toLowerCase()

  if (!q) return { tier: 99, position: 0, length: n.length, distance: 0 }

  const position = n.indexOf(q)
  const prefixDistance = levenshtein(n.slice(0, q.length), q)
  const fullDistance = levenshtein(n, q)
  let tier: number
  if (n === q) tier = 0                    // exact
  else if (n.startsWith(q)) tier = 1       // prefix
  else if (position >= 0) tier = 2         // contains
  else if (prefixDistance <= 2) tier = 3   // typo while typing prefix
  else if (fullDistance <= 2) tier = 4     // typo on full name
  else tier = 99                           // no match
  return {
    tier,
    position: position >= 0 ? position : prefixDistance,
    length: n.length,
    distance: Math.min(prefixDistance, fullDistance),
  }
}

export default function useSubscriptionCreation() {
  const subscriptionRepository = inject<SubscriptionRepository>('subscriptionRepository')
  const categoryRepository = inject<CategoryRepository>('categoryRepository')
  const providerRepository = inject<ProviderRepository>('providerRepository')

  if (!subscriptionRepository || !categoryRepository || !providerRepository) {
    throw new Error('Subscription repositories are not provided')
  }

  const service = new AddSubscriptionService(
    subscriptionRepository,
    categoryRepository,
    providerRepository,
  )

  const name = ref('')
  const price = ref({ amount: 0, currency: Currency.EUR })
  const renewal = ref({ amount: 1, unit: RenewalPeriodUnitEnum.MONTHS })
  const bookingDate = ref('')
  const dateParts = reactive({ day: '', month: '', year: '' })

  const providerName = ref('')
  const providerSearch = ref('')
  const availableProviders = ref<Provider[]>([])
  const availableCategories = ref<Category[]>([])
  const selectedCategories = ref<Category[]>([])

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)
  const isLoading = ref(true)

  // providers with rank < 99 relative to query
  const providerHints = computed(() => {
    const query = providerSearch.value.trim().toLowerCase()
    if (!query) {
      return availableProviders.value.slice(0, MAX_PROVIDER_HINTS)
    }
    return availableProviders.value.map(provider => ({
      ...provider,
      rank: providerRank(provider.name, query),
    })).filter(provider => provider.rank.tier < 99).sort((a, b) =>
      a.rank.tier - b.rank.tier
      || a.rank.position - b.rank.position
      || a.rank.length - b.rank.length
      || a.rank.distance - b.rank.distance
      || a.name.localeCompare(b.name)
    )
  })

  // names of providers, capped at MAX_PROVIDER_HINTS
  const providerHintNames = computed(() =>
    providerHints.value.slice(0, MAX_PROVIDER_HINTS).map(provider => provider.name),
  )

  // all categories not in selectedCategories
  const selectableCategories = computed(() =>
    availableCategories.value.filter(
      category => !selectedCategories.value.some(selected => selected.id.value === category.id.value),
    ),
  )

  // watch date parts and update booking date
  watch(
    () => [dateParts.day, dateParts.month, dateParts.year],
    ([day, month, year]) => {
      if (day && month && year) {
        const y = year.toString().padStart(4, '0')
        const m = month.toString().padStart(2, '0')
        const d = day.toString().padStart(2, '0')
        bookingDate.value = `${y}-${m}-${d}`
      } else {
        bookingDate.value = ''
      }
    },
    { immediate: true },
  )

  // on mount, load available categories and providers
  onMounted(async () => {
    try {
      await reloadCatalogs()
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Daten konnten nicht geladen werden'
    } finally {
      isLoading.value = false
    }
  })

  function selectExistingCategory(category: Category) {
    // if already selected, do nothing
    if (selectedCategories.value.some(selected => selected.id.value === category.id.value)) {
      return
    }
    selectedCategories.value.push(category)
  }

  // filter out category from selectedCategories
  function removeCategory(category: Category) {
    selectedCategories.value = selectedCategories.value.filter(
      selected => selected.id.value !== category.id.value,
    )
  }

  async function createAndSelectCategory(categoryAddDto: CategoryAddDto) {
    submitError.value = null
    try {
      const category = await service.addCategory(categoryAddDto)
      if (!category) {
        throw new Error('Kategorie konnte nicht erstellt werden')
      }

      if (!availableCategories.value.some(existing => existing.id.value === category.id.value)) {
        availableCategories.value.push(category)
      }

      // select the new category
      selectExistingCategory(category)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kategorie konnte nicht erstellt werden'
      submitError.value = message
      throw error
    }
  }

  async function reloadCatalogs() {
    const [categories, providers] = await Promise.all([
      service.getAvailableCategories(),
      service.getAvailableProviders(),
    ])
    availableCategories.value = categories
    availableProviders.value = providers
  }

  async function resetForm() {
    name.value = ''
    price.value = { amount: 0, currency: Currency.EUR }
    renewal.value = { amount: 1, unit: RenewalPeriodUnitEnum.MONTHS }
    dateParts.day = ''
    dateParts.month = ''
    dateParts.year = ''
    bookingDate.value = ''
    providerName.value = ''
    providerSearch.value = ''
    selectedCategories.value = []

    await reloadCatalogs()
  }

  async function submitSubscription() {
    submitError.value = null

    if (!name.value.trim()) {
      submitError.value = 'Bitte einen Namen eingeben'
      return
    }
    if (!providerName.value.trim()) {
      submitError.value = 'Bitte einen Vertragspartner eingeben'
      return
    }
    if (!bookingDate.value) {
      submitError.value = 'Bitte ein gültiges Datum eingeben'
      return
    }

    isSubmitting.value = true
    try {
      await service.addSubscription(
        {
          name: name.value.trim(),
          provider: { name: providerName.value.trim() },
          categories: selectedCategories.value,
          price: price.value,
          renewal: renewal.value,
          bookingDate: bookingDate.value,
        }
      )

      await resetForm()
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Abonnement konnte nicht gespeichert werden'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    name,
    price,
    renewal,
    bookingDate,
    dateParts,
    providerName,
    providerSearch,
    providerHints,
    providerHintNames,
    availableCategories,
    selectedCategories,
    selectableCategories,
    isSubmitting,
    submitError,
    isLoading,
    selectExistingCategory,
    removeCategory,
    createAndSelectCategory,
    submitSubscription,
  }
}
