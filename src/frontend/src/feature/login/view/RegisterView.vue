<script setup lang="ts">
import useRegistration from '../composables/useRegistration'

const { username, email, password, passwordConfirm, fieldErrors, formError, isSubmitting, submit } =
  useRegistration()
</script>

<template>
    <v-sheet elevation="2">
        <v-sheet class="pa-5">
            <v-form @submit.prevent="submit">
                <v-alert v-if="formError" type="error" variant="tonal" class="mb-4">{{ formError }}</v-alert>
                <v-text-field
                    v-model="username"
                    class="mb-4"
                    label="Benutzername"
                    variant="outlined"
                    autocomplete="username"
                    :error-messages="fieldErrors.username"
                ></v-text-field>
                <v-text-field
                    v-model="email"
                    class="mb-4"
                    label="E-Mail"
                    variant="outlined"
                    type="email"
                    autocomplete="email"
                    :error-messages="fieldErrors.email"
                ></v-text-field>
                <v-text-field
                    v-model="password"
                    class="mb-4"
                    label="Passwort"
                    variant="outlined"
                    type="password"
                    autocomplete="new-password"
                    :error-messages="fieldErrors.password"
                ></v-text-field>
                <v-text-field
                    v-model="passwordConfirm"
                    class="mb-4"
                    label="Passwort wiederholen"
                    variant="outlined"
                    type="password"
                    autocomplete="new-password"
                    :error-messages="fieldErrors.password_confirm"
                ></v-text-field>
                <v-btn rounded="lg" block type="submit" variant="outlined" :loading="isSubmitting" :disabled="isSubmitting">Konto erstellen</v-btn>
            </v-form>
            <div class="text-center mt-4">
                <router-link to="/login">Bereits ein Konto? Anmelden</router-link>
            </div>
        </v-sheet>
    </v-sheet>
</template>
