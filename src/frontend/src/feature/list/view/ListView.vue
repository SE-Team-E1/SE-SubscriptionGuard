<script setup lang="ts">

import {
  mdiInboxOutline,
  mdiSpotify,
  mdiFire,
} from '@mdi/js'
import useSubscriptionList from "@/feature/list/composables/useSubscriptionList.ts";
import {onMounted} from "vue";
import type {Price, RenewalPeriod} from "@/domain/domain";

const {list, isLoading, hasError, loadList} = useSubscriptionList();
const renewalToString = (renewal: RenewalPeriod) => {
  return renewal.amount.toFixed() + " " + renewal.unit;
}

const priceToString = (price: Price) => {
  return price.amount.toFixed(2) + " " + "€"; // TODO replace with currency mapping
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

  <v-empty-state
    v-else-if="list.length === 0"
    class="list-state"
    :icon="mdiInboxOutline"
    headline="Your list is empty"
    title="No subscriptions yet"
    text="Add your first subscription to see it here."
    action-text="Add subscription"
    to="/add"
  />

  <v-list v-else lines="two" density="default">
    <v-list-item
      v-for="sub in list"
      :key="sub.id.value"
      :title="sub.name"
      :subtitle="`${priceToString(sub.price)} · ${renewalToString(sub.renewal)}`"
      :prepend-icon="mdiSpotify"
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

<style scoped>
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
