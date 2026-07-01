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
import {RestSubscriptionRepository} from "@/repository/subscriptions/restRepositories.ts";
import {
  MockedCategoryRepository, MockedProviderRepository,
  MockedSubscriptionRepository
} from "@/repository/subscriptions/mockedRepositories.ts";

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

app.provide<SubscriptionRepository, string>("subscriptionRepository", new MockedSubscriptionRepository());
app.provide<CategoryRepository, string>("categoryRepository", new MockedCategoryRepository());
app.provide<ProviderRepository, string>("providerRepository", new MockedProviderRepository());


app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')
