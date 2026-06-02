<script setup lang="ts">

import DefaultAppBar from "@/components/DefaultAppBar.vue";
import {mdiFilterOutline, mdiPlus} from "@mdi/js";
import type {DefaultAppBarProps} from "@/components/types";


const props = defineProps<DefaultAppBarProps>()
</script>

<template>
  <DefaultAppBar :title="props.title" >
    <template #extension>
      <div class="d-flex flex-column w-100">
        <v-chip-group>
          <v-chip label>Favourites</v-chip>
          <v-chip label>Recent</v-chip>
          <v-chip label>
            <v-icon :icon="mdiPlus"></v-icon>
          </v-chip>
        </v-chip-group>
        <div class="search-bar d-flex flex-row  ga-2">
          <v-text-field placeholder="Search" rounded="lg" density="compact" variant="outlined" ></v-text-field>
          <v-btn color="#DDD" :icon="mdiFilterOutline" density="compact" variant="flat" rounded="lg"></v-btn>
        </div>
      </div>
    </template>
  </DefaultAppBar>
</template>

<style scoped>

.v-toolbar__extension {
  align-items: start;
}
.search-bar {
  height: 40px;
}
.search-bar .v-text-field {
  height: 40px;
}
.search-bar .v-btn {
  width: 40px;
  height: 40px;
}
</style>
