import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/home-view.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/login-view.vue'),
        },
        // Admin Routes
        {
            path: '/admin',
            name: 'admin',
            component: () => import('@/views/admin/admin-layout.vue'),
            children: [
                {
                    path: '',
                    name: 'admin-dashboard',
                    component: () => import('@/views/admin/admin-dashboard.vue'),
                },
                {
                    path: 'templates',
                    name: 'admin-templates',
                    component: () => import('@/views/admin/templates-view.vue'),
                },
                {
                    path: 'groups',
                    name: 'admin-groups',
                    component: () => import('@/views/admin/groups-view.vue'),
                },
                {
                    path: 'sections',
                    name: 'admin-sections',
                    component: () => import('@/views/admin/sections-view.vue'),
                },
                {
                    path: 'blueprints',
                    name: 'admin-blueprints',
                    component: () => import('@/views/admin/blueprints-view.vue'),
                },
            ],
        },
        // Collaborator Routes
        {
            path: '/collaborator',
            name: 'collaborator',
            component: () => import('@/views/collaborator/collaborator-layout.vue'),
            children: [
                {
                    path: '',
                    name: 'collaborator-dashboard',
                    component: () => import('@/views/collaborator/collaborator-dashboard.vue'),
                },
                {
                    path: 'scripts',
                    name: 'collaborator-scripts',
                    component: () => import('@/views/collaborator/scripts-view.vue'),
                },
                {
                    path: 'scripts/:scriptId/setups',
                    name: 'collaborator-setups',
                    component: () => import('@/views/collaborator/setups-view.vue'),
                },
                {
                    path: 'setups/:setupId/flows',
                    name: 'collaborator-flows',
                    component: () => import('@/views/collaborator/flows-view.vue'),
                },
            ],
        },
        // Legacy routes (keeping for backward compatibility)
        {
            path: '/templates',
            name: 'templates',
            component: () => import('@/views/templates-view.vue'),
        },
        {
            path: '/editor/:id?',
            name: 'editor',
            component: () => import('@/views/editor-view.vue'),
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/views/not-found-view.vue'),
        },
    ],
})

export default router
