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
  <div class="category-box">
    <div class="category-toolbar">
      <v-icon :icon="mdiTagOutline" size="small" class="category-icon" />

      <v-select
        v-model="selectedCategoryId"
        :items="categoryItems"
        item-title="title"
        item-value="value"
        label="Kategorie wählen"
        density="compact"
        variant="outlined"
        hide-details
        class="category-select"
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

    <div v-if="selected.length" class="category-pills">
      <v-chip
        v-for="category in selected"
        :key="category.id.value"
        closable
        size="small"
        class="category-pill"
        @click:close="emit('remove', category)"
      >
        <v-icon v-if="category.icon" :icon="category.icon" size="x-small" start />
        {{ category.name }}
      </v-chip>
    </div>
  </div>

  <v-dialog v-model="showCreateDialog" max-width="420">
    <v-card title="Neue Kategorie">
      <v-card-text>
        <v-text-field
          v-model="newCategoryName"
          label="Name"
          autofocus
          hide-details="auto"
          class="mb-4"
        />

        <div class="icon-picker-label">Icon</div>
        <div class="icon-grid">
          <button
            v-for="iconOption in CATEGORY_ICON_OPTIONS"
            :key="iconOption.value"
            type="button"
            class="icon-option"
            :class="{ selected: newCategoryIcon === iconOption.value }"
            :aria-label="iconOption.label"
            @click="newCategoryIcon = iconOption.value"
          >
            <v-icon :icon="iconOption.value" size="small" />
          </button>
        </div>

        <p v-if="createError" class="create-error">{{ createError }}</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showCreateDialog = false">Abbrechen</v-btn>
        <v-btn color="primary" :loading="isCreating" @click="confirmCreateCategory">Erstellen</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.category-box {
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.category-select {
  flex: 1;
  min-width: 0;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-pill {
  background: var(--color-background-mute);
  color: var(--color-text);
  font-size: 18px;
  padding: 8px 16px;
}

.icon-picker-label {
  font-size: 13px;
  margin-bottom: 8px;
  opacity: 0.7;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.icon-option {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  padding: 8px;
  cursor: pointer;
}

.icon-option.selected {
  border-color: var(--color-heading);
  background: var(--color-background-soft);
}

.create-error {
  margin-top: 12px;
  color: #c62828;
  font-size: 13px;
}
</style>
