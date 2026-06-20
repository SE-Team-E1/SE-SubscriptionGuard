import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/list',
      name: 'list',
      component: () => import('../feature/list/view/ListView.vue'),
      meta: { pageTitle: 'Subscriptions' },
    }
  ],
})

export default router
