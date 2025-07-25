<script setup>
import { useAuthStore } from '@/stores/auth-store'
import { useManagementStore } from '@/stores/management-store'
import { RouterLink, useRouter } from 'vue-router'
import { computed } from 'vue'

const authStore = useAuthStore()
const managementStore = useManagementStore()
const router = useRouter()

// Redirect if not collaborator
if (!authStore.isCollaborator) {
    router.push('/login')
}

const userScripts = computed(() => {
    const currentUser = authStore.currentAccessKey
    return managementStore.scripts.filter((script) => script.createdBy === currentUser)
})

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
            </div>
            <div class="flex-none gap-2">
                <div class="badge badge-secondary">{{ authStore.getUserRoleDisplayName() }}</div>
                <button class="btn btn-ghost btn-sm" @click="logout">Logout</button>
            </div>
        </div>

        <div class="container mx-auto p-6">
            <div class="mb-8">
                <h1 class="text-3xl font-bold mb-2">Collaborator Dashboard</h1>
                <p class="text-base-content/70">Create and manage your scripts and workflows</p>
            </div>

            <!-- Stats Overview -->
            <div class="stats shadow mb-8 w-full">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block w-8 h-8 stroke-current"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                        </svg>
                    </div>
                    <div class="stat-title">My Scripts</div>
                    <div class="stat-value text-primary">{{ userScripts.length }}</div>
                    <div class="stat-desc">Active projects</div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block w-8 h-8 stroke-current"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            ></path>
                        </svg>
                    </div>
                    <div class="stat-title">Available Templates</div>
                    <div class="stat-value text-secondary">{{ managementStore.blueprints.length }}</div>
                    <div class="stat-desc">Ready to use</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title text-primary">My Scripts</h2>
                        <p class="text-sm text-base-content/70">
                            Create and manage your script projects with multiple sections and workflows.
                        </p>
                        <div class="card-actions justify-end">
                            <RouterLink to="/collaborator/scripts" class="btn btn-primary btn-sm">
                                Manage Scripts
                            </RouterLink>
                        </div>
                    </div>
                </div>

                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title text-secondary">Legacy Editor</h2>
                        <p class="text-sm text-base-content/70">
                            Access the original flow editor for freestyle workflow creation.
                        </p>
                        <div class="card-actions justify-end">
                            <RouterLink to="/editor" class="btn btn-secondary btn-sm">Open Editor</RouterLink>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Scripts -->
            <div class="mt-8">
                <h2 class="text-2xl font-bold mb-4">Recent Scripts</h2>

                <div v-if="userScripts.length > 0" class="space-y-4">
                    <div v-for="script in userScripts.slice(0, 5)" :key="script.id" class="card bg-base-100 shadow">
                        <div class="card-body">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="card-title text-lg">{{ script.name }}</h3>
                                    <p class="text-sm text-base-content/70">
                                        {{ script.description || 'No description' }}
                                    </p>
                                    <div class="text-xs text-base-content/50 mt-2">
                                        Sections: {{ script.sections?.length || 0 }} • Created:
                                        {{ new Date(script.createdAt).toLocaleDateString() }}
                                    </div>
                                </div>
                                <RouterLink
                                    :to="`/collaborator/scripts/${script.id}/setups`"
                                    class="btn btn-sm btn-outline"
                                >
                                    Open
                                </RouterLink>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="text-center py-8">
                    <div class="text-4xl mb-4">📝</div>
                    <h3 class="text-xl font-semibold mb-2">No scripts yet</h3>
                    <p class="text-base-content/70 mb-4">Create your first script to get started</p>
                    <RouterLink to="/collaborator/scripts" class="btn btn-primary">Create Script</RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>
