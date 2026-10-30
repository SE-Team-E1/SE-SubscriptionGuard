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
  ],
})

export default router
