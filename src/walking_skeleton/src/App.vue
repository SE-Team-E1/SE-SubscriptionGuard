<script setup lang="ts">
import {computed} from 'vue'
import {RouterView, useRoute} from 'vue-router'
import {mdiHome, mdiListBoxOutline, mdiPlusCircleOutline} from "@mdi/js";
import DefaultAppBar from "@/components/DefaultAppBar.vue";
import ListAppBar from "@/feature/list/components/ListAppBar.vue";

const route = useRoute();
const hideAppBar = computed(() => route.meta.hideBar === true)
const hideNavigation = computed(() => route.meta.hideNavigation === true)
</script>

<template>
  <v-app>

    <ListAppBar v-if="!hideAppBar && route.name === 'list'" :title="route.meta.pageTitle" />
    <DefaultAppBar v-else-if="!hideAppBar" :title="route.meta.pageTitle" />

    <v-main>
      <RouterView/>
    </v-main>

    <v-bottom-navigation v-if="!hideNavigation" grow>
      <v-btn to="/overview">
        <v-icon :icon="mdiHome"></v-icon>
        <span>Overview</span>
      </v-btn>

      <v-btn to="/add">
        <v-icon :icon="mdiPlusCircleOutline"></v-icon>

        <span>Add</span>
      </v-btn>

      <v-btn to="/list">
        <v-icon :icon="mdiListBoxOutline"></v-icon>

        <span>Subscriptions</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>


<style scoped>
@media (min-width: 504px) {
  .v-bottom-navigation {
    display: none;
  }
}
</style>
