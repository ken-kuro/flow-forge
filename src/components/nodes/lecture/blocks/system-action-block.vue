<script setup>
import { ref, onUnmounted, computed, watch } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { Settings } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import { useFlowContextStore } from '@/stores/flow-context-store.js'
import { getSystemActionMethods, getSystemActionTargets } from '@/utils/flow-context-filtering.js'

/**
 * SystemActionBlock - A context-aware block for system actions in Lecture nodes.
 * Uses flow context filtering to show only relevant action methods and targets based on LMS and asset configuration.
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
     * @type {{id: string, type: string, data: {title: string, action: string, delay: number, methods: string[], targets: string[]}}}
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
const title = ref(props.block.data.title ?? 'System Action')
const action = ref(props.block.data.action || 'asset-interaction')
const delay = ref(props.block.data.delay ?? 0)
const methods = ref(props.block.data.methods || [])
const targets = ref(props.block.data.targets || [])

// Available actions (extensible for future API calls, jobs, etc.)
const actionOptions = [
    { value: 'asset-interaction', label: 'Asset Interaction' },
    // Future: api-call, do-job, etc.
]

// Get context-aware available methods based on LMS asset and elements configuration
const availableMethods = computed(() => {
    const lmsType = flowContextStore.lmsType
    const questionType = flowContextStore.questionType
    const objects = flowContextStore.objects
    const texts = flowContextStore.texts

    if (!lmsType || !questionType) {
        // No LMS configuration available, return empty array
        return []
    }

    return getSystemActionMethods(lmsType, questionType, objects, texts)
})

// Get context-aware available targets for selected methods
const availableTargets = computed(() => {
    const objects = flowContextStore.objects
    const allTargets = []

    // Get targets for each selected method
    for (const methodValue of methods.value) {
        const methodTargets = getSystemActionTargets(methodValue, objects)
        allTargets.push(...methodTargets)
    }

    // Remove duplicates and return unique targets
    return [...new Set(allTargets)]
})

// Check if we have valid context for showing methods
const hasValidContext = computed(() => {
    return flowContextStore.lmsType !== null
})

// Detect conflicts in current selection
const conflictWarning = computed(() => {
    if (!hasValidContext.value) return null

    const warnings = []

    // Check method conflicts
    if (methods.value.length > 0) {
        const validMethodValues = availableMethods.value.map((m) => m.value)
        const invalidMethods = methods.value.filter((method) => !validMethodValues.includes(method))

        if (invalidMethods.length > 0) {
            warnings.push(`Methods not available: ${invalidMethods.join(', ')}`)
        }
    }

    // Check target conflicts
    if (targets.value.length > 0) {
        const invalidTargets = targets.value.filter((target) => !availableTargets.value.includes(target))

        if (invalidTargets.length > 0) {
            warnings.push(`Targets not available: ${invalidTargets.join(', ')}`)
        }
    }

    return warnings.length > 0 ? warnings.join('. ') : null
})

// Filter selected methods/targets to only include valid ones for display
const validMethods = computed(() => {
    const validMethodValues = availableMethods.value.map((m) => m.value)
    return methods.value.filter((method) => validMethodValues.includes(method))
})

const validTargets = computed(() => {
    return targets.value.filter((target) => availableTargets.value.includes(target))
})

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        action: action.value,
        delay: delay.value,
        methods: methods.value, // Save all methods, let conflict detection handle validation
        targets: targets.value, // Save all targets, let conflict detection handle validation
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

// Handle target selection (multiple choice)
const toggleTarget = (targetValue) => {
    const index = targets.value.indexOf(targetValue)
    if (index > -1) {
        targets.value.splice(index, 1)
    } else {
        targets.value.push(targetValue)
    }
    updateBlockData(true)
}

const isTargetSelected = (target) => {
    return targets.value.includes(target)
}

// Watch for context changes and clean up invalid methods/targets
watch(
    [
        () => flowContextStore.lmsType,
        () => flowContextStore.questionType,
        () => flowContextStore.objects,
        () => flowContextStore.texts,
    ],
    () => {
        // Filter out any methods that are no longer valid
        const validMethodValues = availableMethods.value.map((m) => m.value)
        const filteredMethods = methods.value.filter((method) => validMethodValues.includes(method))

        // Filter out any targets that are no longer valid
        const filteredTargets = targets.value.filter((target) => availableTargets.value.includes(target))

        let hasChanges = false
        if (filteredMethods.length !== methods.value.length) {
            methods.value = filteredMethods
            hasChanges = true
        }

        if (filteredTargets.length !== targets.value.length) {
            targets.value = filteredTargets
            hasChanges = true
        }

        if (hasChanges) {
            updateBlockData(true)
        }
    },
    { immediate: true },
)

// Watch for method changes and update targets accordingly
watch(
    methods,
    () => {
        // When methods change, filter targets to only include valid ones for the new method selection
        const filteredTargets = targets.value.filter((target) => availableTargets.value.includes(target))
        if (filteredTargets.length !== targets.value.length) {
            targets.value = filteredTargets
            updateBlockData(true)
        }
    },
    { immediate: true },
)
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="Settings"
        icon-color="text-success"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter system action block name"
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

        <!-- Action Type -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Action Type</span>
            </label>
            <select v-model="action" @blur="updateBlockData" class="select select-bordered select-xs">
                <option v-for="option in actionOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>

        <!-- Asset Interaction Fields (show only when action is asset-interaction) -->
        <div v-if="action === 'asset-interaction'">
            <!-- Delay Field -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Delay (in seconds)</span>
                </label>
                <input
                    v-model="delay"
                    @blur="updateBlockData"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.5"
                    class="input input-bordered input-xs"
                />
            </div>

            <!-- Method Selection (Multiple Choice) -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Method view</span>
                </label>

                <!-- Show methods dropdown when context is valid -->
                <div v-if="hasValidContext && availableMethods.length > 0" class="dropdown w-full">
                    <div
                        tabindex="0"
                        role="button"
                        class="select select-bordered select-xs w-full flex items-center cursor-pointer"
                    >
                        <span v-if="validMethods.length === 0" class="text-base-content/50"
                            >Select view methods...</span
                        >
                        <span v-else class="text-left">{{
                            validMethods
                                .map((m) => availableMethods.find((am) => am.value === m)?.label || m)
                                .join(', ')
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
                                    class="checkbox checkbox-xs checkbox-success"
                                />
                                <div class="flex flex-col">
                                    <span class="label-text text-xs font-medium">{{ method.label }}</span>
                                    <span class="label-text text-xs text-base-content/70">{{
                                        method.description
                                    }}</span>
                                </div>
                            </label>
                        </li>
                    </ul>
                </div>

                <!-- Show message when no context or methods available -->
                <div v-else class="select select-bordered select-xs w-full flex items-center text-base-content/50">
                    <span v-if="!hasValidContext"> Configure LMS asset in setup node first </span>
                    <span v-else> No action methods available for this configuration </span>
                </div>
            </div>

            <!-- Targets Selection (Multiple Choice) -->
            <div v-if="validMethods.length > 0" class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Targets</span>
                </label>

                <!-- Show targets dropdown when available -->
                <div v-if="availableTargets.length > 0" class="dropdown w-full">
                    <div
                        tabindex="0"
                        role="button"
                        class="select select-bordered select-xs w-full flex items-center cursor-pointer"
                    >
                        <span v-if="validTargets.length === 0" class="text-base-content/50">Select targets...</span>
                        <span v-else class="text-left">{{ validTargets.join(', ') }}</span>
                    </div>
                    <ul
                        tabindex="0"
                        class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300"
                    >
                        <li v-for="target in availableTargets" :key="target">
                            <label class="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded">
                                <input
                                    type="checkbox"
                                    :checked="isTargetSelected(target)"
                                    @change="toggleTarget(target)"
                                    class="checkbox checkbox-xs checkbox-success"
                                />
                                <span class="label-text text-xs">{{ target }}</span>
                            </label>
                        </li>
                    </ul>
                </div>

                <!-- Show message when no targets available -->
                <div v-else class="select select-bordered select-xs w-full flex items-center text-base-content/50">
                    <span>No targets available for selected methods</span>
                </div>
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
