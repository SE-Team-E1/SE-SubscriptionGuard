<script setup lang="ts">
import DefaultAppBar from '@/feature/DefaultAppBar.vue'
import CategoryPicker from '@/feature/add/view/CategoryPicker.vue'
import useSubscriptionCreation from '@/feature/add/useSubscriptionCreation'
import { Currency, RenewalPeriodUnitEnum } from '@/domain/domain'
import {
  mdiAccountOutline,
  mdiCameraOutline,
  mdiClockOutline,
  mdiTagOutline,
  mdiTrayArrowDown,
} from '@mdi/js'

const currencies = [
  { title: '€', value: Currency.EUR },
  { title: '$', value: Currency.USD },
  { title: '£', value: Currency.GBP },
]

const intervalUnits = [
  { title: 'Tage', value: RenewalPeriodUnitEnum.DAYS },
  { title: 'Wochen', value: RenewalPeriodUnitEnum.WEEKS },
  { title: 'Monate', value: RenewalPeriodUnitEnum.MONTHS },
  { title: 'Jahre', value: RenewalPeriodUnitEnum.YEARS },
]

const {
  name,
  price,
  renewal,
  dateParts,
  providerName,
  providerSearch,
  providerHintNames,
  selectedCategories,
  selectableCategories,
  isSubmitting,
  submitError,
  isLoading,
  nameError,
  providerError,
  dateError,
  priceError,
  intervalError,
  submitBlockReason,
  canSubmit,
  touchName,
  touchProvider,
  touchDate,
  selectExistingCategory,
  removeCategory,
  createAndSelectCategory,
  submitSubscription,
} = useSubscriptionCreation()
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

  <div class="screen">
    <v-progress-linear v-if="isLoading" indeterminate class="mb-2" />

    <form class="d-flex flex-column ga-3 pt-2" @submit.prevent="submitSubscription">
      <v-text-field
        v-model="name"
        label="Name"
        placeholder="Name"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :error-messages="nameError || undefined"
        :prepend-inner-icon="mdiTagOutline"
        @blur="touchName"
      />

      <v-row align="start">
        <v-col cols="8">
          <v-text-field
            v-model.number="price.amount"
            label="Kosten"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :error-messages="priceError || undefined"
          />
        </v-col>
        <v-col cols="4">
          <v-select
            v-model="price.currency"
            :items="currencies"
            label="Währung"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row align="start">
        <v-col cols="4">
          <v-text-field
            v-model="dateParts.day"
            label="Tag"
            placeholder="DD"
            maxlength="2"
            inputmode="numeric"
            variant="outlined"
            density="comfortable"
            hide-details
            :error="Boolean(dateError)"
            @blur="touchDate"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="dateParts.month"
            label="Monat"
            placeholder="MM"
            maxlength="2"
            inputmode="numeric"
            variant="outlined"
            density="comfortable"
            hide-details
            :error="Boolean(dateError)"
            @blur="touchDate"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="dateParts.year"
            label="Jahr"
            placeholder="YYYY"
            maxlength="4"
            inputmode="numeric"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :error-messages="dateError || undefined"
            @blur="touchDate"
          />
        </v-col>
      </v-row>

      <v-combobox
        v-model="providerName"
        v-model:search="providerSearch"
        :items="providerHintNames"
        :custom-filter="() => true"
        label="Vertragspartner"
        placeholder="Vertragspartner"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :error-messages="providerError || undefined"
        :prepend-inner-icon="mdiAccountOutline"
        clearable
        @blur="touchProvider"
        @click:clear="touchProvider"
      />

      <v-row align="start">
        <v-col cols="8">
          <v-text-field
            v-model.number="renewal.amount"
            label="Intervall"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="1"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :error-messages="intervalError || undefined"
            :prepend-inner-icon="mdiClockOutline"
          />
        </v-col>
        <v-col cols="4">
          <v-select
            v-model="renewal.unit"
            :items="intervalUnits"
            label="Einheit"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>

      <CategoryPicker
        :available="selectableCategories"
        :selected="selectedCategories"
        :on-create-category="createAndSelectCategory"
        @select="selectExistingCategory"
        @remove="removeCategory"
      />

      <v-alert
        v-if="submitError"
        type="error"
        variant="text"
        density="compact"
        :text="submitError"
      />

      <v-btn
        type="submit"
        block
        variant="flat"
        class="palette-btn"
        :disabled="!canSubmit || isSubmitting || isLoading"
        :loading="isSubmitting"
      >
        {{ submitBlockReason ?? 'Hinzufügen' }}
      </v-btn>
    </form>
  </div>
</template>

<style scoped>
.screen {
  padding: 0 var(--horizontal-screen-padding) 88px;
}

.palette-btn {
  background: var(--color-heading);
  color: var(--color-background);
}
</style>
