import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/overview',
      name: 'overview',
      component: () => import('../views/DashboardView.vue'),
      meta: { pageTitle: 'Overview' },
    },
    {
      path: '/add',
      name: 'add',
      component: () => import('../feature/add/AddSubscriptionView.vue'),
      meta: { pageTitle: 'Add Subscription' },
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('../feature/list/view/ListView.vue'),
      meta: { pageTitle: 'Subscriptions' },
    }
  ],
})

export default router
