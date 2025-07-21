<script setup>
import { ref, onUnmounted, computed } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { Database } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import { useFlowContextStore } from '@/stores/flow-context-store.js'
import { getCollectUserDataMethods } from '@/utils/flow-context-filtering.js'
import StopPropagationWrapper from '@/components/shared/stop-propagation-wrapper.vue'

/**
 * CollectUserDataBlock - A context-aware block for collecting user data in Lecture nodes.
 * Uses flow context filtering to show only relevant collection methods based on LMS asset type.
 */
const props = defineProps({
    /**
     * The node ID this block belongs to.
     */
    nodeId: {
        type: String,
        required: true,
    },
    /**
     * The block data object.
     * @type {{id: string, type: string, data: {title: string, methods: string[], saveTo: string}}}
     */
    block: {
        type: Object,
        required: true,
    },
})

const { updateBlock, flushPendingSaves } = useFlowEditor()
const flowContextStore = useFlowContextStore()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.title ?? 'Collect User Data')
const methods = ref(props.block.data.methods || [])
const saveTo = ref(props.block.data.saveTo ?? 'user_answer')

// Get context-aware available methods based on LMS asset configuration
const availableMethods = computed(() => {
    const lmsType = flowContextStore.lmsType
    const questionType = flowContextStore.questionType

    if (!lmsType || !questionType) {
        // No LMS configuration available, return empty array
        return []
    }

    return getCollectUserDataMethods(lmsType, questionType)
})

// Check if we have valid context for showing methods
const hasValidContext = computed(() => {
    return flowContextStore.lmsType !== null
})

// Detect conflicts in current method selection
const conflictWarning = computed(() => {
    if (!hasValidContext.value || methods.value.length === 0) return null

    const validMethodValues = availableMethods.value.map((m) => m.value)
    const invalidMethods = methods.value.filter((method) => !validMethodValues.includes(method))

    if (invalidMethods.length > 0) {
        return `Selected methods not available for current LMS configuration: ${invalidMethods.join(', ')}`
    }

    return null
})

// Filter selected methods to only include valid ones for display
const validMethods = computed(() => {
    const validMethodValues = availableMethods.value.map((m) => m.value)
    return methods.value.filter((method) => validMethodValues.includes(method))
})

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        methods: methods.value, // Save all methods, let conflict detection handle validation
        saveTo: saveTo.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

// Handle method selection (multiple choice)
const toggleMethod = (methodValue) => {
    const index = methods.value.indexOf(methodValue)
    if (index > -1) {
        methods.value.splice(index, 1)
    } else {
        methods.value.push(methodValue)
    }
    updateBlockData(true)
}

const isMethodSelected = (method) => {
    return methods.value.includes(method)
}

// Watch for context changes and clean up invalid methods
import { watch } from 'vue'
watch(
    [() => flowContextStore.lmsType, () => flowContextStore.questionType],
    () => {
        // Filter out any methods that are no longer valid
        const validMethodValues = availableMethods.value.map((m) => m.value)
        const filteredMethods = methods.value.filter((method) => validMethodValues.includes(method))

        if (filteredMethods.length !== methods.value.length) {
            methods.value = filteredMethods
            updateBlockData(true)
        }
    },
    { immediate: true },
)
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="Database"
        icon-color="text-warning"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter collect user data block name"
    >
        <!-- Conflict Warning -->
        <div v-if="conflictWarning" class="alert alert-warning text-xs mb-2">
            <div class="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="stroke-current shrink-0 w-4 h-4"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    ></path>
                </svg>
                <span>{{ conflictWarning }}</span>
            </div>
        </div>

        <!-- Method Selection (Multiple Choice) -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Method</span>
            </label>

            <!-- Show methods dropdown when context is valid -->
            <div v-if="hasValidContext && availableMethods.length > 0" class="dropdown w-full">
                <div
                    tabindex="0"
                    role="button"
                    class="select select-bordered select-xs w-full flex items-center cursor-pointer"
                >
                    <span v-if="validMethods.length === 0" class="text-base-content/50">Select methods...</span>
                    <span v-else class="text-left">{{
                        validMethods.map((m) => availableMethods.find((am) => am.value === m)?.label || m).join(', ')
                    }}</span>
                </div>
                <ul
                    tabindex="0"
                    class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300"
                >
                    <li v-for="method in availableMethods" :key="method.value">
                        <label class="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded">
                            <input
                                type="checkbox"
                                :checked="isMethodSelected(method.value)"
                                @change="toggleMethod(method.value)"
                                class="checkbox checkbox-xs checkbox-warning"
                            />
                            <div class="flex flex-col">
                                <span class="label-text text-xs font-medium">{{ method.label }}</span>
                                <span class="label-text text-xs text-base-content/70">{{ method.description }}</span>
                            </div>
                        </label>
                    </li>
                </ul>
            </div>

            <!-- Show message when no context or methods available -->
            <div v-else class="select select-bordered select-xs w-full flex items-center text-base-content/50">
                <span v-if="!hasValidContext"> Configure LMS asset in setup node first </span>
                <span v-else> No collection methods available for this LMS configuration </span>
            </div>
        </div>

        <!-- Save To Field -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Save to</span>
            </label>
            <StopPropagationWrapper>
                <input
                    v-model="saveTo"
                    @blur="updateBlockData"
                    type="text"
                    placeholder="user_answer"
                    class="input input-bordered input-xs"
                />
            </StopPropagationWrapper>
            <div class="label">
                <span class="label-text-alt text-xs text-base-content/50">
                    Variable where collected data will be stored
                </span>
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
