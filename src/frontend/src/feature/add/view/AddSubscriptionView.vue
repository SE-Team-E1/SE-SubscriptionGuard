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
  selectExistingCategory,
  removeCategory,
  createAndSelectCategory,
  submitSubscription,
} = useSubscriptionCreation()
</script>

<template>
  <DefaultAppBar title="Abonnement hinzufügen">
    <template #extension>
      <div class="actions">
        <button type="button" class="action-btn">
          <v-icon :icon="mdiTrayArrowDown" size="small" />
          Import
        </button>
        <button type="button" class="action-btn">
          <v-icon :icon="mdiCameraOutline" size="small" />
          Scan
        </button>
      </div>
    </template>
  </DefaultAppBar>

  <div class="screen">
    <v-progress-linear v-if="isLoading" indeterminate class="mb-2" />

    <form class="form-card" @submit.prevent="submitSubscription">
      <v-text-field
        v-model="name"
        label="Name"
        placeholder="Name"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :prepend-inner-icon="mdiTagOutline"
      />

      <div class="field horizontal">
        <div class="left">
          <label class="field-label" for="cost-input">Kosten</label>
          <input
            id="cost-input"
            v-model.number="price.amount"
            class="native-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>
        <div class="right">
          <label class="field-label" for="currency-select">Währung</label>
          <select id="currency-select" v-model="price.currency" class="native-input native-select" aria-label="Währung">
            <option :value="Currency.EUR">€</option>
            <option :value="Currency.USD">$</option>
            <option :value="Currency.GBP">£</option>
          </select>
        </div>
      </div>

      <div class="field date-row">
        <div class="field-label">Datum</div>
        <div class="date-inputs">
          <input v-model="dateParts.day" maxlength="2" placeholder="DD" inputmode="numeric" />
          <input v-model="dateParts.month" maxlength="2" placeholder="MM" inputmode="numeric" />
          <input v-model="dateParts.year" maxlength="4" placeholder="YYYY" inputmode="numeric" />
        </div>
      </div>

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
        :prepend-inner-icon="mdiAccountOutline"
        clearable
      />

      <div class="field horizontal">
        <div class="left">
          <label class="field-label" for="interval-input">Intervall</label>
          <div class="interval-input-wrap">
            <v-icon :icon="mdiClockOutline" size="small" class="interval-icon" />
            <input
              id="interval-input"
              v-model.number="renewal.amount"
              class="native-input interval-input"
              type="number"
              min="1"
              placeholder="1"
            />
          </div>
        </div>
        <div class="right">
          <label class="field-label" for="interval-unit-select">Einheit</label>
          <select id="interval-unit-select" v-model="renewal.unit" class="native-input native-select" aria-label="Intervall-Einheit">
            <option :value="RenewalPeriodUnitEnum.DAYS">Tage</option>
            <option :value="RenewalPeriodUnitEnum.WEEKS">Wochen</option>
            <option :value="RenewalPeriodUnitEnum.MONTHS">Monate</option>
            <option :value="RenewalPeriodUnitEnum.YEARS">Jahre</option>
          </select>
        </div>
      </div>

      <CategoryPicker
        :available="selectableCategories"
        :selected="selectedCategories"
        :on-create-category="createAndSelectCategory"
        @select="selectExistingCategory"
        @remove="removeCategory"
      />

      <p v-if="submitError" class="submit-error">{{ submitError }}</p>

      <button class="add-btn" type="submit" :disabled="isSubmitting || isLoading">
        {{ isSubmitting ? 'Speichern…' : 'Hinzufügen' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.screen {
  padding: 0 var(--horizontal-screen-padding) 88px;
}

.actions {
  display: flex;
  gap: 10px;
  width: 100%;
  padding-bottom: 8px;
}

.action-btn {
  flex: 1;
  background: var(--color-heading);
  color: var(--vt-c-indigo);
  border-radius: 8px;
  padding: 10px;
  border: none;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  opacity: 0.7;
}

.field.horizontal {
  flex-direction: row;
  gap: 8px;
}

.field.horizontal .left {
  flex: 1;
  width: 70%;
}

.field.horizontal .right {
  width: 30%;
}

.native-input {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  font-size: 16px;
  color: var(--color-text);
}

.native-select {
  min-height: 44px;
}

.date-inputs {
  display: flex;
  gap: 8px;
}

.date-inputs input {
  flex: 1;
  text-align: center;
  width: 33%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  font-size: 16px;
  color: var(--color-text);
}

.interval-input-wrap {
  position: relative;
}

.interval-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.6;
}

.interval-input {
  padding-left: 36px;
}

.add-btn {
  margin-top: 6px;
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: var(--color-heading);
  color: var(--vt-c-indigo);
  font-weight: 600;
  cursor: pointer;
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-error {
  color: #c62828;
  font-size: 13px;
  margin: 0;
}
</style>
