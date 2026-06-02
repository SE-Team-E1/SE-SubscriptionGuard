<script setup lang="ts">

import {
  mdiSpotify,
  mdiDumbbell,
  mdiControllerClassic
} from '@mdi/js'

interface Subscription {
  icon: string,
  title: string,
  price: string,
  renewal: string
}

const subscriptions: Subscription[] = [
  {
    icon: mdiSpotify,
    title: "Spotify Premium",
    price: "35€",
    renewal: "monatlich"
  },
  {
    icon: mdiDumbbell,
    title: "Fitnessstudio",
    price: "105€",
    renewal: "aller 3 Monate"
  },
  {
    icon: mdiControllerClassic,
    title: "Xbox Game Pass",
    price: "155€",
    renewal: "jährlich"
  }
]
</script>

<template>
  <v-list lines="two" density="default">
    <v-list-item
      v-for="sub in subscriptions"
      :key="sub.title"
      :title="sub.title"
      :prepend-icon="sub.icon"

      variant="outlined"
      rounded="lg"
    >
    </v-list-item>
  </v-list>
</template>

<style scoped>
.v-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px var(--horizontal-screen-padding);
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
