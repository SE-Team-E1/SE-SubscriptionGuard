import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AddSubscriptionView from '@/feature/add/view/AddSubscriptionView.vue'

export const routes: RouteRecordRaw[] = [
  // Anonymous users end up on /login because /list requires a session.
  { path: '/', redirect: '/list' },
  {
    path: '/add',
    name: 'add',
    component: AddSubscriptionView,
    meta: { pageTitle: 'Abonnement hinzufügen', requiresAuth: true },
  },
  { path: '/overview', name: 'overview', component: () => import('@/feature/PlaceholderView.vue'), meta: { pageTitle: 'Overview' } },
  {
    path: '/list',
    name: 'list',
    component: () => import('@/feature/list/view/ListView.vue'),
    meta: { pageTitle: 'Subscriptions', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../feature/login/view/LoginView.vue'),
    meta: { pageTitle: 'Login', layout: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../feature/login/view/RegisterView.vue'),
    meta: { pageTitle: 'Registrieren', layout: 'auth' },
  },
  {
    path: '/forgot-password',
    name: 'reset-passwort',
    component: () => import('../feature/login/view/PasswortResetView.vue'),
    meta: { pageTitle: 'Passwort zurücksetzen', layout: 'auth' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
