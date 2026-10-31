<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CategoryAddDto } from '@/feature/add/dto/categoryAddDto'
import { CATEGORY_ICON_OPTIONS, getDefaultCategoryIcon } from '@/feature/add/categoryIcons'
import type { Category } from '@/domain/subscriptionModel'
import { mdiPlus, mdiTagOutline } from '@mdi/js'

const props = defineProps<{
  available: Category[]
  selected: Category[]
  onCreateCategory: (categoryAddDto: CategoryAddDto) => Promise<void>
}>()

const emit = defineEmits<{
  select: [category: Category]
  remove: [category: Category]
}>()

const selectedCategoryId = ref<string | null>(null)
const showCreateDialog = ref(false)
const newCategoryName = ref('')
const newCategoryIcon = ref(getDefaultCategoryIcon())
const createError = ref<string | null>(null)
const isCreating = ref(false)

const categoryItems = computed(() =>
  props.available.map(category => ({
    title: category.name,
    value: category.id.value,
    icon: category.icon,
  })),
)

function onCategorySelected(categoryId: string | null) {
  if (!categoryId) {
    return
  }

  const category = props.available.find(item => item.id.value === categoryId)
  if (category) {
    emit('select', category)
  }
  selectedCategoryId.value = null
}

function openCreateDialog() {
  newCategoryName.value = ''
  newCategoryIcon.value = getDefaultCategoryIcon()
  createError.value = null
  showCreateDialog.value = true
}

async function confirmCreateCategory() {
  createError.value = null
  const trimmedName = newCategoryName.value.trim()
  if (!trimmedName) {
    createError.value = 'Bitte einen Kategorienamen eingeben'
    return
  }

  isCreating.value = true
  try {
    await props.onCreateCategory({
      name: trimmedName,
      icon: newCategoryIcon.value,
    })
    showCreateDialog.value = false
  } catch (error) {
    createError.value = error instanceof Error ? error.message : 'Kategorie konnte nicht erstellt werden'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <v-card variant="outlined" rounded="lg" class="category-card pa-3">
    <div class="d-flex align-center ga-2">
      <v-icon :icon="mdiTagOutline" size="small" class="flex-shrink-0 opacity-70" />

      <v-select
        v-model="selectedCategoryId"
        :items="categoryItems"
        item-title="title"
        item-value="value"
        label="Kategorie wählen"
        density="compact"
        variant="outlined"
        hide-details
        class="flex-grow-1"
        @update:model-value="onCategorySelected"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps">
            <template #prepend>
              <v-icon v-if="item.icon" :icon="item.icon" size="small" />
            </template>
          </v-list-item>
        </template>
      </v-select>

      <v-btn
        icon
        variant="text"
        size="small"
        aria-label="Neue Kategorie"
        @click="openCreateDialog"
      >
        <v-icon :icon="mdiPlus" />
      </v-btn>
    </div>

    <div v-if="selected.length" class="d-flex flex-wrap ga-2 mt-3">
      <v-chip
        v-for="category in selected"
        :key="category.id.value"
        class="palette-chip"
        closable
        size="small"
        variant="outlined"
        :prepend-icon="category.icon || undefined"
        @click:close="emit('remove', category)"
      >
        {{ category.name }}
      </v-chip>
    </div>
  </v-card>

  <v-dialog v-model="showCreateDialog" max-width="420">
    <v-card title="Neue Kategorie">
      <v-card-text>
        <v-text-field
          v-model="newCategoryName"
          label="Name"
          autofocus
          hide-details="auto"
          class="mb-4"
          :error-messages="createError || undefined"
        />

        <div class="text-body-2 text-medium-emphasis mb-2">Icon</div>
        <v-row>
          <v-col
            v-for="iconOption in CATEGORY_ICON_OPTIONS"
            :key="iconOption.value"
            class="d-flex justify-center"
            cols="2"
          >
            <v-btn
              icon
              size="small"
              :variant="newCategoryIcon === iconOption.value ? 'flat' : 'outlined'"
              :class="newCategoryIcon === iconOption.value ? 'palette-btn' : 'icon-choice'"
              :aria-label="iconOption.label"
              @click="newCategoryIcon = iconOption.value"
            >
              <v-icon :icon="iconOption.value" size="small" />
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showCreateDialog = false">Abbrechen</v-btn>
        <v-btn class="palette-btn" variant="flat" :loading="isCreating" @click="confirmCreateCategory">Erstellen</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.category-card {
  background: var(--color-background-mute);
  border-color: var(--color-border);
  color: var(--color-text);
}

.palette-chip {
  background: var(--color-background-mute);
  color: var(--color-text);
  border-color: var(--color-border);
}

.palette-btn {
  background: var(--color-heading);
  color: var(--color-background);
}

.icon-choice {
  color: var(--color-text);
  border-color: var(--color-border);
}
</style>
