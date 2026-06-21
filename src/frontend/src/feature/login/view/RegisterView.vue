<template>
    <v-sheet elevation="2">
    <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="one">1. Logindaten</v-tab>
        <v-tab value="two">2. Person</v-tab>
        <v-tab value="three">3. Adresse</v-tab>
        <v-tab value="four">Finish</v-tab>
    </v-tabs>

    <v-divider></v-divider>

    <v-tabs-window v-model="tab">
        <v-tabs-window-item value="one">
            <v-sheet class="pa-5">
                <v-form>
                    <v-label class="mb-2">Email</v-label>
                    <v-text-field class="mb-4" variant="outlined" required></v-text-field>
                    <v-label class="mb-2">Password</v-label>
                    <v-text-field class="mb-4" variant="outlined" type="password" required></v-text-field>
                    <v-label class="mb-2">Passwort erneut eingeben</v-label>
                    <v-text-field class="mb-4" variant="outlined" type="password" required></v-text-field>
                    <v-btn rounded="lg" block type="button" variant="outlined" @click="tab = 'two'">Weiter</v-btn>
                </v-form>
            </v-sheet>
        </v-tabs-window-item>

        <v-tabs-window-item value="two">
            <v-sheet class="pa-5">
                <v-form>
                    <v-label class="mb-2">Vorname</v-label>
                    <v-text-field class="mb-4" variant="outlined" required></v-text-field>
                    <v-label class="mb-2">Nachname</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-label class="mb-2">Telefonnummer</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-btn rounded="lg" block type="button" variant="outlined" @click="tab = 'three'">Weiter</v-btn>
                </v-form>
            </v-sheet>
        </v-tabs-window-item>

        <v-tabs-window-item value="three">
            <v-sheet class="pa-5">
                <v-form>
                    <v-label class="mb-2">Strasse</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-label class="mb-2">Hausnummer</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-label class="mb-2">Land</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-label class="mb-2">PLZ</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-btn rounded="lg" block type="button" variant="outlined" @click="tab = 'four'">Weiter</v-btn>
                </v-form>
            </v-sheet>
        </v-tabs-window-item>

        <v-tabs-window-item value="four">
            <v-sheet class="pa-5">
                <div class="h-100 text-center d-none" id="waitingForResponse">
                    <h2 class="mt-16 mb-0" style="font-size: xx-large;"><b>Verarbeitung...</b></h2>
                    <h4 class="mb-16 mt-0">Bitte haben sie einen Augenblick Geduld</h4>
                </div>
                <div class="h-100 text-center" id="afterSuccess">
                    <h2 class="mt-16 mb-0" style="font-size: xx-large;"><b>Herzlich Willkommen</b></h2>
                    <h4 class="mb-16 mt-0">Registrierung erfolgreich</h4>
                    <v-btn rounded="lg" block type="button" variant="outlined" @click="$router.push('/login')">Weiter</v-btn>
                </div>
            </v-sheet>
        </v-tabs-window-item>
    </v-tabs-window>
    </v-sheet>
</template>
<script setup>
  import { ref } from 'vue'

  const tab = ref('one')
</script>