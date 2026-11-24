<script setup lang="ts">
import { mdiCameraOutline, mdiTrayArrowDown } from '@mdi/js'
import DefaultAppBar from '@/feature/DefaultAppBar.vue'
</script>

<template>
  <DefaultAppBar title="Abonnement hinzufügen">
    <template #extension>
      <div class="d-flex ga-2 w-100 pb-2">
        <v-btn type="button" class="palette-btn flex-grow-1" variant="flat" :prepend-icon="mdiTrayArrowDown">
          Import
        </v-btn>
        <v-btn type="button" class="palette-btn flex-grow-1" variant="flat" :prepend-icon="mdiCameraOutline">
          Scan
        </v-btn>
      </div>
    </template>
  </DefaultAppBar>
</template>

<style scoped>
.palette-btn {
  background: var(--color-heading);
  color: var(--color-background);
}
</style>
