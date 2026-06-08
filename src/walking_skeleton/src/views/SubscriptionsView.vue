<script setup lang="ts">

import {
  mdiSpotify,
  mdiDumbbell,
  mdiControllerClassic,
  mdiFire,
} from '@mdi/js'

interface Subscription {
  icon: string,
  title: string,
  price: string,
  renewal: string
  rating: number
}

const subscriptions: Subscription[] = [
  {
    icon: mdiSpotify,
    title: "Spotify Premium",
    price: "35€",
    renewal: "monatlich", 
    rating: 4.5
  },
  {
    icon: mdiDumbbell,
    title: "Fitnessstudio",
    price: "105€",
    renewal: "aller 3 Monate",
    rating: 4.0
  },
  {
    icon: mdiControllerClassic,
    title: "Xbox Game Pass",
    price: "155€",
    renewal: "jährlich",
    rating: 3.5
  }
]
</script>

<template>
  <v-list lines="two" density="default">
    <v-list-item
      v-for="sub in subscriptions"
      :key="sub.title"
      :title="sub.title"
      :subtitle="`${sub.price} · ${sub.renewal}`"
      :prepend-icon="sub.icon"

      variant="outlined"
      rounded="lg"
    >
      <template #append>
        <v-rating
          :model-value="sub.rating"
          :length="Math.ceil(sub.rating)"
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
