<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'
import { useTemplateStore } from '@/stores/template-store'
import { useFlowStore } from '@/stores/flow-store'
import { Plus, Edit, Trash2, Copy } from 'lucide-vue-next'

const authStore = useAuthStore()
const templateStore = useTemplateStore()
const flowStore = useFlowStore()
const router = useRouter()

// Redirect if not admin
if (!authStore.isAdmin) {
    router.push('/login')
}

const showCreateModal = ref(false)
const newTemplate = ref({
    name: '',
    description: '',
})

const searchQuery = ref('')
const filteredTemplates = computed(() => {
    return templateStore.searchTemplates(searchQuery.value)
})

async function createTemplate() {
    if (!newTemplate.value.name) return

    try {
        // Use current flow state as template if it has content
        const hasFlowContent = flowStore.nodes.length > 2 || Object.keys(flowStore.nodeBlocks).length > 0

        const templateData = {
            name: newTemplate.value.name,
            description: newTemplate.value.description,
            nodes: hasFlowContent ? [...flowStore.nodes] : [],
            edges: hasFlowContent ? [...flowStore.edges] : [],
            nodeBlocks: hasFlowContent ? { ...flowStore.nodeBlocks } : {},
        }

        await templateStore.createNewTemplate(templateData)

        // Reset form
        newTemplate.value = { name: '', description: '' }
        showCreateModal.value = false
    } catch (error) {
        alert('Failed to create template: ' + error.message)
    }
}

async function duplicateTemplate(template) {
    const newName = prompt(`Enter name for duplicate of "${template.name}":`, `${template.name} (Copy)`)
    if (!newName) return

    try {
        await templateStore.duplicateTemplate(template.id, newName)
    } catch (error) {
        alert('Failed to duplicate template: ' + error.message)
    }
}

async function deleteTemplate(template) {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return

    try {
        await templateStore.deleteTemplate(template.id)
    } catch (error) {
        alert('Failed to delete template: ' + error.message)
    }
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
                        <li>Templates</li>
                    </ul>
                </div>
            </div>
            <div class="flex-none gap-2">
                <div class="badge badge-primary">{{ authStore.getUserRoleDisplayName() }}</div>
                <button class="btn btn-ghost btn-sm" @click="logout">Logout</button>
            </div>
        </div>

        <div class="container mx-auto p-6">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold">Templates</h1>
                    <p class="text-base-content/70">Create and manage reusable workflow patterns</p>
                </div>
                <button class="btn btn-primary gap-2" @click="showCreateModal = true">
                    <Plus class="w-4 h-4" />
                    Create Template
                </button>
            </div>

            <!-- Search -->
            <div class="mb-6">
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search templates..."
                    class="input input-bordered w-full max-w-md"
                />
            </div>

            <!-- Templates Grid -->
            <div v-if="filteredTemplates.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="template in filteredTemplates" :key="template.id" class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title">{{ template.name }}</h2>
                        <p class="text-sm text-base-content/70">{{ template.description || 'No description' }}</p>

                        <div class="mt-4 text-xs text-base-content/50">
                            <div>Nodes: {{ template.nodes?.length || 0 }}</div>
                            <div>Blocks: {{ Object.keys(template.nodeBlocks || {}).length }}</div>
                            <div>Created: {{ new Date(template.createdAt).toLocaleDateString() }}</div>
                        </div>

                        <div class="card-actions justify-end mt-4">
                            <div class="dropdown dropdown-end">
                                <label tabindex="0" class="btn btn-ghost btn-sm">
                                    <Edit class="w-4 h-4" />
                                </label>
                                <ul
                                    tabindex="0"
                                    class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                                >
                                    <li>
                                        <button @click="duplicateTemplate(template)">
                                            <Copy class="w-4 h-4" />
                                            Duplicate
                                        </button>
                                    </li>
                                    <li>
                                        <button @click="deleteTemplate(template)" class="text-error">
                                            <Trash2 class="w-4 h-4" />
                                            Delete
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-12">
                <div class="text-6xl mb-4">📝</div>
                <h3 class="text-xl font-semibold mb-2">No templates found</h3>
                <p class="text-base-content/70 mb-4">Create your first template to get started</p>
                <button class="btn btn-primary" @click="showCreateModal = true">Create Template</button>
            </div>
        </div>

        <!-- Create Template Modal -->
        <div v-if="showCreateModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">Create New Template</h3>

                <div class="form-control mb-4">
                    <label class="label">
                        <span class="label-text">Template Name</span>
                    </label>
                    <input
                        v-model="newTemplate.name"
                        type="text"
                        placeholder="Enter template name"
                        class="input input-bordered"
                        @keyup.enter="createTemplate"
                    />
                </div>

                <div class="form-control mb-6">
                    <label class="label">
                        <span class="label-text">Description</span>
                    </label>
                    <textarea
                        v-model="newTemplate.description"
                        placeholder="Enter template description"
                        class="textarea textarea-bordered"
                        rows="3"
                    ></textarea>
                </div>

                <div class="modal-action">
                    <button class="btn" @click="showCreateModal = false">Cancel</button>
                    <button class="btn btn-primary" @click="createTemplate" :disabled="!newTemplate.name">
                        Create
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
