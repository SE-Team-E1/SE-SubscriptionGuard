<script setup lang="ts">
import type {DefaultAppBarProps} from "@/feature/types.d";

const props = defineProps<DefaultAppBarProps>()

</script>

<template>
  <v-app-bar
    :height="96"
    :extension-height="$slots.extension ? 110: 48"
    elevation="1"
  >
    <v-app-bar-title>{{props.title}}</v-app-bar-title>
    <template v-if="$slots.extension" #extension>
      <slot name="extension" />
    </template>

    <template #append>
      <v-app-bar-nav-icon size="large" />
    </template>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar-title {
  margin-inline-start: 0px;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.2;
  padding-block: 12px;
}

.v-app-bar-title :deep(.v-toolbar-title__placeholder) {
  white-space: normal;      /* allow multiple lines */
  overflow: visible;
  text-overflow: unset;
  word-break: normal;         /* don't split words mid-word */
  overflow-wrap: break-word;  /* only break a word if it's too long for the line */
}

.v-app-bar {
  padding: 0px var(--horizontal-screen-padding);
}

</style>
