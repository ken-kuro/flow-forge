<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()

const accessKey = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
    if (!accessKey.value.trim()) {
        error.value = 'Please enter an access key'
        return
    }

    isLoading.value = true
    error.value = ''

    try {
        const success = authStore.authenticate(accessKey.value.trim())

        if (success) {
            // Redirect based on user role
            if (authStore.isAdmin) {
                router.push('/admin')
            } else if (authStore.isCollaborator) {
                router.push('/collaborator')
            }
        } else {
            error.value = 'Invalid access key. Please check and try again.'
        }
    } catch {
        error.value = 'An error occurred during login. Please try again.'
    } finally {
        isLoading.value = false
    }
}

// Auto-redirect if already authenticated
if (authStore.isAuthenticated) {
    if (authStore.isAdmin) {
        router.push('/admin')
    } else if (authStore.isCollaborator) {
        router.push('/collaborator')
    }
}
</script>

<template>
    <div class="min-h-screen bg-base-200 flex items-center justify-center">
        <div class="card w-96 bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title justify-center mb-6">Flow Forge Access</h2>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Access Key</span>
                    </label>
                    <input
                        v-model="accessKey"
                        type="password"
                        placeholder="Enter your access key"
                        class="input input-bordered"
                        :class="{ 'input-error': error }"
                        @keyup.enter="handleLogin"
                        :disabled="isLoading"
                    />
                    <label v-if="error" class="label">
                        <span class="label-text-alt text-error">{{ error }}</span>
                    </label>
                </div>

                <div class="card-actions justify-end mt-6">
                    <button
                        class="btn btn-primary w-full"
                        :class="{ loading: isLoading }"
                        @click="handleLogin"
                        :disabled="isLoading"
                    >
                        {{ isLoading ? 'Authenticating...' : 'Access System' }}
                    </button>
                </div>

                <div class="divider">Demo Access Keys</div>

                <div class="text-sm space-y-2">
                    <div class="bg-base-200 p-3 rounded">
                        <strong>Administrator:</strong>
                        <code class="block text-xs mt-1">admin123</code>
                    </div>
                    <div class="bg-base-200 p-3 rounded">
                        <strong>Collaborator:</strong>
                        <code class="block text-xs mt-1">collab456</code>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
