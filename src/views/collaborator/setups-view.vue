<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const router = useRouter()

// Redirect if not collaborator
if (!authStore.isCollaborator) {
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
                <RouterLink to="/collaborator" class="btn btn-ghost text-xl">Flow Forge</RouterLink>
                <div class="breadcrumbs text-sm">
                    <ul>
                        <li><RouterLink to="/collaborator">Dashboard</RouterLink></li>
                        <li><RouterLink to="/collaborator/scripts">Scripts</RouterLink></li>
                        <li>Setups</li>
                    </ul>
                </div>
            </div>
            <div class="flex-none gap-2">
                <div class="badge badge-secondary">{{ authStore.getUserRoleDisplayName() }}</div>
                <button class="btn btn-ghost btn-sm" @click="logout">Logout</button>
            </div>
        </div>

        <div class="container mx-auto p-6">
            <div class="text-center py-12">
                <div class="text-6xl mb-4">⚙️</div>
                <h1 class="text-3xl font-bold mb-2">Setups Management</h1>
                <p class="text-base-content/70 mb-4">Manage blueprint instances and setups (Coming Soon)</p>
                <RouterLink to="/collaborator/scripts" class="btn btn-primary">Back to Scripts</RouterLink>
            </div>
        </div>
    </div>
</template>
