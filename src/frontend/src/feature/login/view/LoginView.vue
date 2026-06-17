<template>
    <v-container class="fill-height pa-0" fluid>
        <v-row class="fill-height" align="center" justify="center">
            <v-col class="mb-16" cols="12" sm="8" md="5" lg="4" xl="3">
                <div class="d-flex justify-center subguard-logo" style="color: var(--v-theme-surface)">
                    <v-icon aria-label="SubscriptionGuard" role="svg" aria-hidden="false" size="300" class="my-auto">
                        <svg class="d-block mx-auto" width="300" height="300" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M110 201.667C110 201.667 183.333 165 183.333 110V45.8333L110 18.3333L36.6667 45.8333V110C36.6667 165 110 201.667 110 201.667Z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M103.008 158.072C96.9493 158.072 90.848 157.389 84.704 156.024C78.6453 154.573 73.6533 152.611 69.728 150.136C68.704 147.064 67.936 143.992 67.424 140.92C66.912 137.848 66.272 133.453 65.504 127.736V127.352C65.6747 126.328 66.2293 125.56 67.168 125.048C70.4107 127.011 73.5253 128.504 76.512 129.528C79.4987 130.467 82.784 130.936 86.368 130.936H89.44L91.488 131.064C93.4507 131.064 95.456 130.765 97.504 130.168C98.6133 129.741 99.3813 128.931 99.808 127.736L93.024 124.408C87.8187 121.933 83.1253 119.288 78.944 116.472C74.592 113.315 71.4773 109.304 69.6 104.44C68.6613 101.795 68.192 98.8933 68.192 95.736C68.192 88.056 70.5387 81.8693 75.232 77.176C79.328 72.9947 84.8747 70.008 91.872 68.216C97.9307 66.7653 104.587 66.04 111.84 66.04C116.107 66.04 121.995 66.5093 129.504 67.448C130.272 67.6187 131.339 67.7893 132.704 67.96L136.544 68.728C139.445 69.24 141.579 69.496 142.944 69.496C143.029 69.496 143.157 69.624 143.328 69.88C143.584 70.136 143.797 70.3493 143.968 70.52C144.309 71.1173 144.651 71.416 144.992 71.416H145.12H145.248L145.504 74.104C145.504 75.384 145.632 76.7493 145.888 78.2C146.144 80.3333 146.272 82.6373 146.272 85.112C146.272 87.2453 146.144 88.7813 145.888 89.72C145.461 91.4267 144.693 92.664 143.584 93.432L131.68 91.896H130.4H128.608C125.707 91.896 122.379 92.1947 118.624 92.792L114.4 93.688C113.376 93.8587 112.864 94.0293 112.864 94.2C112.864 96.248 114.187 98.168 116.832 99.96C118.112 100.643 119.392 101.24 120.672 101.752C121.952 102.179 122.763 102.477 123.104 102.648C129.419 104.44 134.88 107.555 139.488 111.992C141.621 114.04 143.285 116.216 144.48 118.52C145.675 120.824 146.272 123.043 146.272 125.176C146.272 126.456 146.101 127.821 145.76 129.272C145.163 135.672 142.731 141.219 138.464 145.912C134.283 150.093 129.035 153.165 122.72 155.128C117.259 157.091 110.688 158.072 103.008 158.072Z" fill="currentColor"/>
                        </svg>
                    </v-icon>
                </div>
                <h1 class="text-center mb-10 mt-0 text-uppercase" style="font-size: 3rem;line-height: 3rem">Subscription Guard</h1>
                <v-card class="elevation-12">
                    <v-card-text>
                        <v-form>
                            <v-label class="mb-2">Email</v-label>
                            <v-text-field class="mb-4" variant="outlined" required></v-text-field>
                            <v-label class="mb-2">Password</v-label>
                            <v-text-field variant="outlined" type="password" required></v-text-field>
                        </v-form>
                        <v-row density="compact">
                            <v-col cols="12">
                                <v-btn rounded="lg" block variant="outlined" @click="$router.push('/liste')">Login</v-btn>
                            </v-col>   
                            <v-col cols="12" class="d-flex justify-center">
                                <v-label class="text-center text-decoration-underline" rounded="lg" block variant="outlined" @click="$router.push('/forgot-password')">Passwort vergessen?</v-label>
                            </v-col> 
                            <v-col cols="12">
                                <v-btn rounded="lg" block variant="outlined" @click="$router.push('/register')">Registrieren</v-btn>
                            </v-col>
                            <v-divider :thickness="2" class="my-2"></v-divider>
                            <v-col cols="12">
                                <v-btn rounded="lg" block variant="outlined" @click="$router.push('/overview')">Lokal fortfahren</v-btn>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>

@media (max-width: 500px) or (max-height: 900px) {
    .subguard-logo {
        display: none;
    }
}
</style>