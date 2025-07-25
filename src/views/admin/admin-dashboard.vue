<script setup>
import { useAuthStore } from '@/stores/auth-store'
import { useTemplateStore } from '@/stores/template-store'
import { useManagementStore } from '@/stores/management-store'
import { RouterLink, useRouter } from 'vue-router'
import { computed } from 'vue'

const authStore = useAuthStore()
const templateStore = useTemplateStore()
const managementStore = useManagementStore()
const router = useRouter()

// Redirect if not admin
if (!authStore.isAdmin) {
    router.push('/login')
}

const stats = computed(() => ({
    templates: templateStore.templateCount,
    groups: managementStore.groups.length,
    sections: managementStore.sections.length,
    blueprints: managementStore.blueprints.length,
}))

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
            </div>
            <div class="flex-none gap-2">
                <div class="badge badge-primary">{{ authStore.getUserRoleDisplayName() }}</div>
                <button class="btn btn-ghost btn-sm" @click="logout">Logout</button>
            </div>
        </div>

        <div class="container mx-auto p-6">
            <div class="mb-8">
                <h1 class="text-3xl font-bold mb-2">Administrator Dashboard</h1>
                <p class="text-base-content/70">Manage templates, groups, sections, and blueprints</p>
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
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            ></path>
                        </svg>
                    </div>
                    <div class="stat-title">Templates</div>
                    <div class="stat-value text-primary">{{ stats.templates }}</div>
                    <div class="stat-desc">Reusable workflow patterns</div>
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
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            ></path>
                        </svg>
                    </div>
                    <div class="stat-title">Groups</div>
                    <div class="stat-value text-secondary">{{ stats.groups }}</div>
                    <div class="stat-desc">Template collections</div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-accent">
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
                                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                            ></path>
                        </svg>
                    </div>
                    <div class="stat-title">Sections</div>
                    <div class="stat-value text-accent">{{ stats.sections }}</div>
                    <div class="stat-desc">Activity categories</div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-info">
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
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            ></path>
                        </svg>
                    </div>
                    <div class="stat-title">Blueprints</div>
                    <div class="stat-value text-info">{{ stats.blueprints }}</div>
                    <div class="stat-desc">Workflow compositions</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title text-primary">Templates</h2>
                        <p class="text-sm text-base-content/70">
                            Create and manage reusable workflow templates with predefined node structures.
                        </p>
                        <div class="card-actions justify-end">
                            <RouterLink to="/admin/templates" class="btn btn-primary btn-sm">Manage</RouterLink>
                        </div>
                    </div>
                </div>

                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title text-secondary">Groups</h2>
                        <p class="text-sm text-base-content/70">
                            Organize templates into groups with positioning for blueprint construction.
                        </p>
                        <div class="card-actions justify-end">
                            <RouterLink to="/admin/groups" class="btn btn-secondary btn-sm">Manage</RouterLink>
                        </div>
                    </div>
                </div>

                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title text-accent">Sections</h2>
                        <p class="text-sm text-base-content/70">
                            Create sections representing different activity types and assign groups.
                        </p>
                        <div class="card-actions justify-end">
                            <RouterLink to="/admin/sections" class="btn btn-accent btn-sm">Manage</RouterLink>
                        </div>
                    </div>
                </div>

                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title text-info">Blueprints</h2>
                        <p class="text-sm text-base-content/70">
                            Build blueprints that define structural compositions for collaborators.
                        </p>
                        <div class="card-actions justify-end">
                            <RouterLink to="/admin/blueprints" class="btn btn-info btn-sm">Manage</RouterLink>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity (placeholder) -->
            <div class="mt-8">
                <h2 class="text-2xl font-bold mb-4">Getting Started</h2>
                <div class="bg-base-100 rounded-lg p-6 shadow">
                    <div class="steps w-full">
                        <div class="step step-primary">Create Templates</div>
                        <div class="step">Organize into Groups</div>
                        <div class="step">Define Sections</div>
                        <div class="step">Build Blueprints</div>
                    </div>
                    <div class="mt-4 text-sm text-base-content/70">
                        Start by creating templates, then organize them into groups, define sections for activity types,
                        and finally build blueprints that collaborators can use to create their workflows.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
