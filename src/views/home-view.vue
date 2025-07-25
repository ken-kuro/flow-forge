<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
</script>

<template>
    <div class="hero min-h-full bg-base-200">
        <div class="hero-content text-center text-base-content">
            <div class="max-w-md">
                <h1 class="text-5xl font-bold">Welcome to Flow Forge</h1>
                <p class="py-6">
                    Enhanced flow management system with template-based workflows and role-based access control. Create,
                    organize, and build flows with ease.
                </p>

                <div v-if="authStore.isAuthenticated" class="space-y-4">
                    <div class="alert alert-success">
                        <span>You are logged in as {{ authStore.getUserRoleDisplayName() }}</span>
                    </div>

                    <div class="flex gap-4 justify-center">
                        <RouterLink v-if="authStore.isAdmin" to="/admin" class="btn btn-primary">
                            Admin Dashboard
                        </RouterLink>
                        <RouterLink v-if="authStore.isCollaborator" to="/collaborator" class="btn btn-primary">
                            Collaborator Dashboard
                        </RouterLink>
                        <RouterLink to="/editor" class="btn btn-outline"> Legacy Editor </RouterLink>
                    </div>
                </div>

                <div v-else class="space-y-4">
                    <RouterLink to="/login" class="btn btn-primary"> Access System </RouterLink>

                    <div class="divider">OR</div>

                    <RouterLink to="/editor" class="btn btn-outline"> Try Legacy Editor </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>
