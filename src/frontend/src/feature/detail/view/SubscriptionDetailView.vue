<script setup lang="ts">
import { computed } from 'vue'
import type { Subscription } from '@/domain/subscriptionModel'
import {
  formatDateOnly,
  formatPrice,
  formatRenewal,
  formatTimestampDate,
} from '@/feature/detail/format'
import {
  mdiAccountOutline,
  mdiCalendarOutline,
  mdiClockOutline,
  mdiCashMultiple,
  mdiTagMultipleOutline,
  mdiTagOutline,
  mdiCalendarPlus,
} from '@mdi/js'

const props = defineProps<{
  subscription?: Subscription
}>()

const NOT_SPECIFIED = 'nicht angegeben'

const name = computed(() => props.subscription?.name.trim() || '')
const providerName = computed(() => props.subscription?.provider.name.trim() || '')
</script>

<template>
  <!-- The app bar title comes from the route meta (pageTitle) and is rendered in App.vue.
       It stays fixed: the bar has a fixed height, long subscription names would overflow it. -->
  <div class="screen">
    <p v-if="!subscription" class="empty-state">Kein Abonnement ausgewählt.</p>

    <dl v-else class="details">
      <div class="detail-row">
        <dt><v-icon :icon="mdiTagOutline" size="small" />Name</dt>
        <dd :class="{ 'not-specified': !name }">{{ name || NOT_SPECIFIED }}</dd>
      </div>

      <div class="detail-row">
        <dt><v-icon :icon="mdiCashMultiple" size="small" />Kosten</dt>
        <dd>{{ formatPrice(subscription.price) }}</dd>
      </div>

      <div class="detail-row">
        <dt><v-icon :icon="mdiCalendarOutline" size="small" />Datum</dt>
        <dd>{{ formatDateOnly(subscription.bookingDate) }}</dd>
      </div>

      <div class="detail-row">
        <dt><v-icon :icon="mdiAccountOutline" size="small" />Vertragspartner</dt>
        <dd :class="{ 'not-specified': !providerName }">{{ providerName || NOT_SPECIFIED }}</dd>
      </div>

      <div class="detail-row">
        <dt><v-icon :icon="mdiClockOutline" size="small" />Intervall</dt>
        <dd>{{ formatRenewal(subscription.renewal) }}</dd>
      </div>

      <div class="detail-row">
        <dt><v-icon :icon="mdiTagMultipleOutline" size="small" />Kategorien</dt>
        <dd v-if="subscription.categories.length" class="category-pills">
          <v-chip
            v-for="category in subscription.categories"
            :key="category.id.value"
            size="small"
            class="category-pill"
          >
            <v-icon v-if="category.icon" :icon="category.icon" size="x-small" start />
            {{ category.name }}
          </v-chip>
        </dd>
        <dd v-else class="not-specified">{{ NOT_SPECIFIED }}</dd>
      </div>

      <div class="detail-row">
        <dt><v-icon :icon="mdiCalendarPlus" size="small" />Erstellt am</dt>
        <dd>{{ formatTimestampDate(subscription.createdAt) }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.screen {
  padding: 8px var(--horizontal-screen-padding) 88px;
}

.empty-state {
  opacity: 0.7;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-mute);
}

dt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: 0.7;
}

dd {
  margin: 0;
  font-size: 18px;
  color: var(--color-heading);
  overflow-wrap: anywhere;
}

.not-specified {
  opacity: 0.6;
  font-style: italic;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-pill {
  background: var(--color-background);
  color: var(--color-text);
  font-size: 16px;
  padding: 8px 16px;
}
</style>
