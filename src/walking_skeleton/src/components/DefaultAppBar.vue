<script setup lang="ts">
import type {DefaultAppBarProps} from "@/components/types";

const props = defineProps<DefaultAppBarProps>()

</script>

<template>
  <v-app-bar
    :extension-height="$slots.extension ? 110: 48"
    elevation="1"
  >
    <v-app-bar-title>{{props.title}}</v-app-bar-title>
    <template v-if="$slots.extension" #extension>
      <slot name="extension" />
    </template>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar-title {
  margin-inline-start: 0px;
}
.v-app-bar {
  padding: 0px var(--horizontal-screen-padding);
}

</style>
