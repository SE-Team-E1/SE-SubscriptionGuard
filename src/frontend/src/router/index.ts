import { createRouter, createWebHistory } from 'vue-router'
import AddSubscriptionView from '@/feature/add/view/AddSubscriptionView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/add',
    },
    {
      path: '/add',
      name: 'add',
      component: AddSubscriptionView,
    },
    {
      path: '/overview',
      name: 'overview',
      component: () => import('@/feature/PlaceholderView.vue'),
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('@/feature/PlaceholderView.vue'),
    },
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
    },
  ],
})

export default router
