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
    }
  ],
})

export default router
