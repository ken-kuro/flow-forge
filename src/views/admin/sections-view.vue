<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const router = useRouter()

// Redirect if not admin
if (!authStore.isAdmin) {
    router.push('/login')
}

function logout() {
    authStore.logout()
    router.push('/')
}
</script>

<template>
    <div class="min-h-screen bg-base-200">
        <!-- Navigation -->
        <div class="navbar bg-base-100 shadow-lg">
            <div class="flex-1">
                <RouterLink to="/admin" class="btn btn-ghost text-xl">Flow Forge Admin</RouterLink>
                <div class="breadcrumbs text-sm">
                    <ul>
                        <li><RouterLink to="/admin">Dashboard</RouterLink></li>
                        <li>Sections</li>
                    </ul>
                </div>
            </div>
            <div class="flex-none gap-2">
                <div class="badge badge-primary">{{ authStore.getUserRoleDisplayName() }}</div>
                <button class="btn btn-ghost btn-sm" @click="logout">Logout</button>
            </div>
        </div>

        <div class="container mx-auto p-6">
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🏷️</div>
                <h1 class="text-3xl font-bold mb-2">Sections Management</h1>
                <p class="text-base-content/70 mb-4">Create and manage activity sections (Coming Soon)</p>
                <RouterLink to="/admin" class="btn btn-primary">Back to Dashboard</RouterLink>
            </div>
        </div>
    </div>
</template>
