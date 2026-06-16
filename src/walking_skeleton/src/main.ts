import './assets/main.css'

import { createApp } from 'vue'
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
  type SubscriptionRepository
} from "./repository/subscriptions/repositories.ts";
import {RestSubscriptionRepository} from "@/repository/subscriptions/restRepositories.ts";

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

app.provide<SubscriptionRepository, string>("subscriptionRepository", new RestSubscriptionRepository());

app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')
