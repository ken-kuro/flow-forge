import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/home-view.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/templates',
      name: 'templates',
      component: () => import('@/views/templates-view.vue')
    },
    {
      path: '/editor/:id?',
      name: 'editor',
      component: () => import('@/views/editor-view.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/not-found-view.vue')
    }
  ]
})

export default router 