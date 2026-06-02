import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/overview',
      name: 'overview',
      component: HomeView,
      meta: { pageTitle: 'Overview' },
    },
    {
      path: '/add',
      name: 'add',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
      meta: { pageTitle: 'Add Subscription' },
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('../views/SubscriptionsView.vue'),
      meta: { pageTitle: 'Subscriptions' },
    }
  ],
})

export default router
