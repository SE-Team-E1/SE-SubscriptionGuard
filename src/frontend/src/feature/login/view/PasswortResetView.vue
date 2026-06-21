<template>
    <v-sheet elevation="2">
    <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="one">1. Zurücksetzen</v-tab>
        <v-tab value="two">2. Email-Code</v-tab>
        <v-tab value="three">3. Neues Passwort</v-tab>
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
                    <v-text-field class="mb-4" variant="outlined" required></v-text-field>
                    <v-btn rounded="lg" block type="button" variant="outlined" @click="tab = 'two'">Passwort zurücksetzen</v-btn>
                </v-form>
            </v-sheet>
        </v-tabs-window-item>

        <v-tabs-window-item value="two">
            <v-sheet class="pa-5">
                <v-form>
                    <v-label>Email-Code<br>Du erhälts in den nächsten Minuten eine Mail von uns. Gebe den erhaltenen Code hier ein:</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-label>SMS-Code<br>Du erhälts in den nächsten Minuten eine SMS von uns. Gebe den erhaltenen Code hier ein:</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-btn rounded="lg" block type="button" variant="outlined" @click="tab = 'three'">Weiter</v-btn>
                </v-form>
            </v-sheet>
        </v-tabs-window-item>

        <v-tabs-window-item value="three">
            <v-sheet class="pa-5">
                <v-form>
                    <v-label class="mb-2">Neues Passwort</v-label>
                    <v-text-field class="mb-4" variant="outlined"></v-text-field>
                    <v-label class="mb-2">Passwort bestätigen</v-label>
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
                    <h2 class="mt-16 mb-0" style="font-size: xx-large;"><b>Erfolg</b></h2>
                    <h4 class="mb-16 mt-0">Passwort erfolgreich zurückgesetzt</h4>
                    <v-btn rounded="lg" block type="button" variant="outlined" @click="$router.push('/login')">Zurück zur Anmeldung</v-btn>
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