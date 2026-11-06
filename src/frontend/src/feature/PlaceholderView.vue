<script setup lang="ts">
import { useRoute } from 'vue-router'
import DefaultAppBar from '@/feature/DefaultAppBar.vue'

const route = useRoute()
</script>

<template>
  <DefaultAppBar :title="route.name?.toString() ?? 'SubscriptionGuard'" />
  <div class="placeholder">
    <p>Diese Seite ist noch nicht implementiert.</p>
  </div>
</template>

<style scoped>
.placeholder {
  padding: 24px var(--horizontal-screen-padding);
  opacity: 0.7;
}
</style>
