<script setup lang="ts">
import {computed, reactive, ref, watch} from 'vue'
import useSubscriptionCreation from "@/feature/add/useSubscriptionCreation.ts";
import {Currency, RenewalPeriodUnitEnum} from "@/domain/domain.ts";

const form = reactive({
  name: '',
  cost: '',
  currency: '€',
  day: '',
  month: '',
  year: '',
  partner: '',
  interval: 1,
  intervalUnit: 'Monate',
  category: ''
})

const {newSubscription, submitSubscription} = useSubscriptionCreation();
const date = reactive({
  day: "",
  month: "",
  year: "",
})
const category = ref("");

// update dto, when date input has changed
watch(
  () => [date.day, date.month, date.year],
  ([day, month, year]) => {
    if (day && month && year) {
      const y = year.toString().padStart(4, '0');
      const m = month.toString().padStart(2, '0');
      const d = day.toString().padStart(2, '0');
      newSubscription.value.startDate = `${y}-${m}-${d}`;
    } else {
      // optional: leer setzen, falls nicht komplett
      newSubscription.value.startDate = '';
    }
  },
  { immediate: true })
watch(
  category,
  value => {
    if(newSubscription.value.categories.length>0) {
      newSubscription.value.categories[0] = value;
    }else {
      newSubscription.value.categories.push(value);
    }
  }
)
</script>


<template>
  <div class="screen">

    <!-- import / scan buttons -->
    <div class="actions">
      <button class="action-btn">
        <span class="icon">⬇️</span>
        Import
      </button>
      <button class="action-btn">
        <span class="icon">📷</span>
        Scan
      </button>
    </div>

    <!-- form card -->
    <form class="form-card" @submit.prevent="submitSubscription">
      <!-- Name -->
      <label class="field">
        <div class="field-label">Name</div>
        <input v-model="newSubscription.name" type="text" placeholder="Name" />
      </label>

      <!-- Costs + currency -->
      <label class="field horizontal">
        <div class="left">
          <div class="field-label">Kosten</div>
          <input class="input-100" v-model="newSubscription.price.amount" type="number" step="0.01" placeholder="0.00" />
        </div>
        <div class="right">
          <select class="input-100 select" v-model="newSubscription.price.currency" aria-label="currency">
            <option :value="Currency.EUR" >€</option>
            <option :value="Currency.USD">$</option>
            <option :value="Currency.GBP">£</option>
          </select>
        </div>
      </label>

      <!-- Date (DD MM YYYY) -->
      <div class="field date-row">
        <div class="field-label">Date</div>
        <div class="date-inputs">
          <input v-model="date.day" maxlength="2" placeholder="DD" />
          <input v-model="date.month" maxlength="2" placeholder="MM" />
          <input v-model="date.year" maxlength="4" placeholder="YYYY" />
        </div>
      </div>

      <!-- Contract partner -->
      <label class="field">
        <div class="field-label">Vertragspartner</div>
        <input v-model="newSubscription.provider" type="text" placeholder="Name" />
      </label>

      <!-- Interval + unit -->
      <label class="field horizontal">
        <div class="left">
          <div class="field-label">Intervall</div>
          <input class="input-100" v-model="newSubscription.renewalPeriod.amount" type="number" min="1" placeholder="1" />
        </div>
        <div class="right">
          <select class="input-100 select" v-model="newSubscription.renewalPeriod.unit" aria-label="interval unit">
            <option :value="RenewalPeriodUnitEnum.DAYS">Tage</option>
            <option :value="RenewalPeriodUnitEnum.WEEKS">Wochen</option>
            <option :value="RenewalPeriodUnitEnum.MONTHS">Monate</option>
            <option :value="RenewalPeriodUnitEnum.YEARS">Jahre</option>
          </select>
        </div>
      </label>

      <!-- Category -->
      <label class="field">
        <div class="field-label">Kategorie</div>
        <input v-model="category" type="text" placeholder="Kategorie" />
      </label>

      <!-- Submit -->
      <button class="add-btn" type="submit">Hinzufügen</button>
    </form>
  </div>
</template>


<style scoped>
.input-100{
  width:100%;
}
.appbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:8px 4px;
  color:#333;
}
.title{
  font-size:20px;
  font-weight:600;
  flex:1;
  text-align:left;
  margin-left:8px;
}
.menu-btn{
  background:transparent;
  border:none;
  font-size:20px;
}

.actions{
  display:flex;
  gap:10px;
  margin:10px 0;
}
.action-btn{
  flex:1;
  background:var(--color-background);
  border-radius:8px;
  padding:10px;
  border:none;
  display:flex;
  gap:8px;
  align-items:center;
  justify-content:center;
}

.form-card{
  background:transparent;
  padding:10px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.field{
  display:flex;
  flex-direction:column;
  gap:6px;
}
.field-label{
  font-size:13px;
  color:var(--color-secondary);
}
.field input, .field select{
  padding:10px;
  border-radius:10px;
  border:1px solid var(--color-border);
  background:var(--color-background);
  font-size:16px;
}
.field.horizontal{
  display:flex;
  flex-direction:row;
  gap:8px;
}
.field.horizontal .left{
  flex:1;
  width:70%;
}
.field.horizontal .right{
  width:30%;
  place-content:end;
}

.field.horizontal .right select{
  margin-bottom:.5vh;
}

.date-row .date-inputs{
  display:flex;
  gap:8px;
}

.date-inputs input{
  flex:1;
  text-align:center;
  width:33%;
  padding:10px;
  border-radius:8px;
  border:1px solid var(--color-border);
  background:var(--color-background);
}

.add-btn{
  margin-top:6px;
  width:100%;
  padding:12px;
  border-radius:10px;
  border:none;
  background:var(--color-background);
  color:white;
  font-weight:600;
}

.bottom-nav{
  position:fixed;
  left:0;
  right:0;
  bottom:0;
  max-width:420px;
  margin:0 auto;
  display:flex;
  gap:4px;
  padding:8px;
  background:var(--color-background);
  box-shadow:0 -1px 6px rgba(0,0,0,0.08);
}
.nav-btn{
  flex:1;
  padding:8px;
  border-radius:8px;
  border:none;
  background:transparent;
}
.nav-btn.active{
  background:var(--color-background);
  font-weight:600;
}
</style>
