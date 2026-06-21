import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../feature/login/view/LoginView.vue'),
      meta: { pageTitle: 'Login' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../feature/login/view/RegisterView.vue'),
      meta: { pageTitle: 'Registrieren' },
    },
    {
      path: '/forgot-password',
      name: 'reset-passwort',
      component: () => import('../feature/login/view/PasswortResetView.vue'),
      meta: { pageTitle: 'Passwort zurücksetzen' },
    }
  ],
})

export default router
