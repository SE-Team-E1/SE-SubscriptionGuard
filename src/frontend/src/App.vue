<script setup lang="ts">
import {RouterView, useRoute} from 'vue-router'
import {mdiHome, mdiListBoxOutline, mdiPlusCircleOutline} from "@mdi/js";
import DefaultAppBar from "@/feature/DefaultAppBar.vue";
import ListAppBar from "@/feature/list/components/ListAppBar.vue";

const route = useRoute();
</script>

<template>
  <v-app>
    <ListAppBar v-if="route.name === 'list'" :title="route.meta.pageTitle" />
    <DefaultAppBar v-else :title="route.meta.pageTitle">
    </DefaultAppBar>
    <v-main>
      <RouterView/>
    </v-main>
    <v-bottom-navigation grow>
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
