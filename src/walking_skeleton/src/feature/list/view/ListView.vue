<script setup lang="ts">

import {
  mdiSpotify,
  mdiDumbbell,
  mdiControllerClassic,
  mdiFire,
} from '@mdi/js'
import useSubscriptionList from "@/feature/list/composables/useSubscriptionList.ts";
import {computed, onMounted} from "vue";
import type {Price, RenewalPeriod} from "@/domain/domain.ts";

const {list, loadList} = useSubscriptionList();
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
  <v-list lines="two" density="default">
    <v-list-item
      v-for="sub in list"
      :key="sub.id"
      :title="sub.name"
      :subtitle="`${priceToString(sub.price)} · ${renewalToString(sub.renewalPeriod)}`"
      :prepend-icon="mdiSpotify"

      variant="outlined"
      rounded="lg"
    >
      <template #append>
        <v-rating
          :model-value="sub.rating ? sub.rating.value : 0"
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
