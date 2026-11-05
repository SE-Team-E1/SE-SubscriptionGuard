<script setup lang="ts">

import {
  mdiInboxOutline,
  mdiTagOutline,
  mdiFire,
} from '@mdi/js'
import useSubscriptionList from "@/feature/list/composables/useSubscriptionList.ts";
import {onMounted} from "vue";
import {currencySymbols, type Currency, type Price, type RenewalPeriod} from "@/domain/domain";

const {list, issues, providerLoadFailed, isLoading, hasError, loadList} = useSubscriptionList();
const renewalToString = (renewal: RenewalPeriod) => {
  return renewal.amount.toFixed() + " " + renewal.unit;
}

const currencyToString = (currency: Currency) => {
  return currencySymbols[currency];
}

const priceToString = (price: Price) => {
  return price.amount.toFixed(2) + " " + currencyToString(price.currency);
}

onMounted(() => {
  loadList();
})

</script>

<template>
  <v-container v-if="isLoading" class="list-state" role="status" aria-live="polite">
    <v-progress-circular indeterminate color="primary" aria-label="Loading subscriptions" />
    <v-card-text>Loading subscriptions…</v-card-text>
  </v-container>

  <v-alert
    v-else-if="hasError"
    class="list-state list-error"
    type="error"
    variant="tonal"
    role="alert"
    text="Subscriptions couldn’t be loaded. Check your connection and try again."
  >
    <template #append>
      <v-btn color="primary" variant="tonal" @click="loadList">Try again</v-btn>
    </template>
  </v-alert>

  <template v-else>
    <v-alert
      v-if="issues.length"
      class="list-warning"
      type="warning"
      variant="tonal"
      role="alert"
      :title="providerLoadFailed ? 'Provider details couldn’t be loaded' : 'Some subscriptions couldn’t be loaded'"
    >
      <p v-if="providerLoadFailed">
        Your subscriptions couldn’t be displayed because provider details are unavailable. Try again to reload them.
      </p>
      <p v-else>
        {{ issues.length }} {{ issues.length === 1 ? 'subscription is' : 'subscriptions are' }}
        missing provider details. This list is incomplete.
      </p>
      <ul>
        <li v-for="issue in issues" :key="issue.subscriptionId">
          {{ issue.subscriptionName }}: {{ issue.reason === 'provider-load-failed' ? 'provider details couldn’t be loaded' : 'provider unavailable' }}
        </li>
      </ul>
      <v-btn class="mt-3" variant="tonal" @click="loadList">Try again</v-btn>
    </v-alert>

    <v-empty-state
      v-if="list.length === 0 && issues.length === 0"
      class="list-state"
      :icon="mdiInboxOutline"
      headline="Your list is empty"
      title="No subscriptions yet"
      text="Add your first subscription to see it here."
      action-text="Add subscription"
      to="/add"
    />

    <v-list v-if="list.length" lines="two" density="default">
      <v-list-item
        v-for="sub in list"
        :key="sub.id.value"
        :title="sub.name"
        :subtitle="`${priceToString(sub.price)} · ${renewalToString(sub.renewal)}`"
        :prepend-icon="sub.categories.find(category => category.icon.trim())?.icon || mdiTagOutline"
        variant="outlined"
        rounded="lg"
      >
        <template #append>
          <v-rating
            :model-value="5"
            :length="5"
            half-increments
            density="compact"
            color="grey-lighten-1"
            active-color="orange"
            size="small"
            background-color="grey-lighten-1"
            readonly
            :empty-icon="mdiFire"
            :full-icon="mdiFire"
          />
        </template>
      </v-list-item>
    </v-list>
  </template>
</template>

<style scoped>
.list-warning {
  margin: 16px var(--horizontal-screen-padding);
}
.list-warning ul {
  padding-left: 20px;
  overflow-wrap: anywhere;
}
.list-state {
  min-height: 220px;
}
.list-error {
  max-width: 600px;
  margin: 24px auto;
}
.v-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px var(--horizontal-screen-padding);
  overflow-x: hidden;
}
.v-list-item {
  border-color: gray;
}
.v-list-item-title {
  font-weight: 600;
  font-size: 16px;
  color: #3f51b5;
}
</style>
