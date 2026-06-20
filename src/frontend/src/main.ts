import './assets/main.css'

import {createApp, inject} from 'vue'
import { createPinia } from 'pinia'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

import App from './App.vue'
import router from './router'
import {
  type CategoryRepository, type ProviderRepository,
  type SubscriptionRepository
} from "./repository/subscriptions/repositories.ts";
import {
  type RestCategoryDTO,
  type RestProviderDTO,
  type RestSubscriptionDTO,
} from "@/repository/subscriptions/restRepositories.ts";
import {
  MockedCategoryRepository, MockedProviderRepository,
  MockedSubscriptionRepository
} from "@/repository/subscriptions/mockedRepositories.ts";
import {Category, Provider, Subscription} from "@/domain/subscriptionModel.ts";
import {Currency, RenewalPeriodUnitEnum} from "@/domain/domain.ts";
import {mapSubscriptionEntityToDTO} from "@/services/subscriptionServices.ts";

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

const app = createApp(App)

function createTestEntities(amount: number): Subscription[] {
  return [...Array(amount).keys()].map(i => {
    const provider = Provider.create(`Subscription ${i} GmbH`);
    const category = Category.create({name: `Category ${i}`, icon: `icon-category-${i}`});
    const subscription = Subscription.create({
        name: "Subscription " + i,
        price: {
          amount: i * 100,
          currency: Currency.EUR
        },
        categories: [category],
        provider: provider,
        bookingDate: new Date(),
        renewal: {
          amount: i,
          unit: RenewalPeriodUnitEnum.MONTHS
        }
      }
    )
    return subscription;
  })
}

function mapTestEntitiesToDTO(subscriptions: Subscription[]): {subscription: RestSubscriptionDTO, provider: RestProviderDTO, categories: RestCategoryDTO[]}[] {
  return subscriptions.map(s => {
    return {
      subscription: mapSubscriptionEntityToDTO(s),
      provider: {
        id: s.provider.id.value,
        name: s.provider.name
      },
      categories: s.categories.map(c => ({
        id: c.id.value,
        name: c.name,
        icon: c.icon
      }))
    }
  });
}

if( import.meta.env.DEV) {
  const entities = createTestEntities(3);
  const dtos = mapTestEntitiesToDTO(entities);

  const subRepo = new MockedSubscriptionRepository(dtos.map(dto => dto.subscription));
  const catRepo = new MockedCategoryRepository(dtos.map(dto => dto.categories).flat());
  const provRepo = new MockedProviderRepository(dtos.map(dto => dto.provider));

  app.provide<SubscriptionRepository, string>("subscriptionRepository", subRepo);
  app.provide<CategoryRepository, string>("categoryRepository", catRepo);
  app.provide<ProviderRepository, string>("providerRepository", provRepo);
}


app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')
