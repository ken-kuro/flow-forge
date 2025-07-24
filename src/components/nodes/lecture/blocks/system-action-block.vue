<script setup>
import { ref, onUnmounted, computed, watch } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { Settings } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import { useFlowContextStore } from '@/stores/flow-context-store.js'
import { getSystemActionMethods, getSystemActionTargets } from '@/utils/flow-context-filtering.js'
import StopPropagationWrapper from '@/components/shared/stop-propagation-wrapper.vue'

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
const action = ref(props.block.data.action ?? 'asset-interaction')
const delay = ref(props.block.data.delay ?? 0.0)
const method = ref(props.block.data.method ?? '') // Changed from methods array to single method
const targets = ref(props.block.data.targets ?? [])

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

    // Always call getSystemActionMethods, let it decide what to return
    return getSystemActionMethods(lmsType, questionType, objects, texts)
})

// Get context-aware available targets for selected method
const availableTargets = computed(() => {
    const objects = flowContextStore.objects
    const hasLmsContext = flowContextStore.lmsType !== null

    if (!method.value) return []

    // Get targets for the selected method
    return getSystemActionTargets(method.value, objects, hasLmsContext)
})

// Check if we have valid context for showing methods
const hasValidContext = computed(() => {
    // Valid context if we have LMS configuration OR objects for manual highlighting
    return flowContextStore.lmsType !== null || flowContextStore.objects.length > 0
})

// Detect conflicts in current selection
const conflictWarning = computed(() => {
    if (!hasValidContext.value) return null

    const warnings = []

    // Check method conflicts
    if (method.value) {
        const validMethodValues = availableMethods.value.map((m) => m.value)
        const isInvalidMethod = !validMethodValues.includes(method.value)

        if (isInvalidMethod) {
            warnings.push(`Method not available: ${method.value}`)
        }
    }

    // Check target conflicts
    if (targets.value.length > 0) {
        const availableTargetIds = availableTargets.value.map((t) => t.id)
        const invalidTargets = targets.value.filter((target) => !availableTargetIds.includes(target))

        if (invalidTargets.length > 0) {
            warnings.push(`Targets not available: ${invalidTargets.join(', ')}`)
        }
    }

    return warnings.length > 0 ? warnings.join('. ') : null
})

// Filter selected method/targets to only include valid ones for display
const validMethod = computed(() => {
    if (!method.value) return ''
    const validMethodValues = availableMethods.value.map((m) => m.value)
    return validMethodValues.includes(method.value) ? method.value : ''
})

const validTargets = computed(() => {
    const availableTargetIds = availableTargets.value.map((t) => t.id)
    return targets.value.filter((target) => availableTargetIds.includes(target))
})

// Get display names for valid targets
const validTargetsWithNames = computed(() => {
    return validTargets.value.map((targetId) => {
        const targetObj = availableTargets.value.find((t) => t.id === targetId)
        return targetObj ? targetObj.name : targetId
    })
})

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        action: action.value,
        delay: delay.value,
        method: method.value, // Save single method, let conflict detection handle validation
        targets: targets.value, // Save all targets, let conflict detection handle validation
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

// Handle method selection (single choice)
const setMethod = (methodValue) => {
    method.value = methodValue
    // Clear targets when method changes since they may not be valid for new method
    targets.value = []
    updateBlockData(true)
}

const isMethodSelected = (methodValue) => {
    return method.value === methodValue
}

// Handle target selection (multiple choice)
const toggleTarget = (targetId) => {
    const index = targets.value.indexOf(targetId)
    if (index > -1) {
        targets.value.splice(index, 1)
    } else {
        targets.value.push(targetId)
    }
    updateBlockData(true)
}

const isTargetSelected = (targetId) => {
    return targets.value.includes(targetId)
}

// TODO: PERFORMANCE - The `deep: true` watcher on context objects is convenient but could be a performance bottleneck on very complex flows.
// Future optimizations could involve:
// 1. Watching a computed hash of the objects instead of the objects themselves.
// 2. Creating a more specific event bus for context changes.
// Watch for context changes and clean up invalid method/targets
watch(
    [
        () => flowContextStore.lmsType,
        () => flowContextStore.questionType,
        () => flowContextStore.objects,
        () => flowContextStore.texts,
        () => method.value, // Also watch method changes
    ],
    () => {
        let hasChanges = false

        // Check if current method is still valid
        const validMethodValues = availableMethods.value.map((m) => m.value)
        if (method.value && !validMethodValues.includes(method.value)) {
            method.value = ''
            hasChanges = true
        }

        // When method changes, or context changes, filter targets to only include valid ones
        const availableTargetIds = availableTargets.value.map((t) => t.id)
        const originalTargets = [...targets.value]
        const filteredTargets = originalTargets.filter((targetId) => availableTargetIds.includes(targetId))

        if (filteredTargets.length !== originalTargets.length) {
            targets.value = filteredTargets
            hasChanges = true
        }

        // If there were any changes, trigger a single update
        if (hasChanges) {
            updateBlockData(true)
        }
    },
    { immediate: true, deep: true },
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
            <StopPropagationWrapper>
                <select v-model="action" @blur="updateBlockData" class="select select-bordered select-xs">
                    <option v-for="option in actionOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </option>
                </select>
            </StopPropagationWrapper>
        </div>

        <!-- Asset Interaction Fields (show only when action is asset-interaction) -->
        <div v-if="action === 'asset-interaction'">
            <!-- Delay Field -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Delay (in seconds)</span>
                </label>
                <StopPropagationWrapper>
                    <input
                        v-model="delay"
                        @blur="updateBlockData"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        class="input input-bordered input-xs"
                    />
                </StopPropagationWrapper>
            </div>

            <!-- Method Selection (Single Choice) -->
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
                        <span v-if="validMethod === ''" class="text-base-content/50">Select method...</span>
                        <span v-else class="text-left">{{
                            availableMethods.find((am) => am.value === validMethod)?.label || validMethod
                        }}</span>
                    </div>
                    <ul
                        tabindex="0"
                        class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300"
                    >
                        <li v-for="methodItem in availableMethods" :key="methodItem.value">
                            <label class="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded">
                                <input
                                    type="radio"
                                    :name="`method-${nodeId}-${block.id}`"
                                    :checked="isMethodSelected(methodItem.value)"
                                    @change="setMethod(methodItem.value)"
                                    class="radio radio-xs radio-success"
                                />
                                <div class="flex flex-col">
                                    <span class="label-text text-xs font-medium">{{ methodItem.label }}</span>
                                    <span class="label-text text-xs text-base-content/70">{{
                                        methodItem.description
                                    }}</span>
                                </div>
                            </label>
                        </li>
                    </ul>
                </div>

                <!-- Show message when no context or methods available -->
                <div v-else class="select select-bordered select-xs w-full flex items-center text-base-content/50">
                    <span v-if="!hasValidContext"> Configure LMS asset or add objects in setup node first </span>
                    <span v-else> No action methods available for this configuration </span>
                </div>
            </div>

            <!-- Targets Selection (Multiple Choice) -->
            <div v-if="validMethod !== ''" class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Targets</span>
                </label>

                <!-- Show targets dropdown when available -->
                <div v-if="availableTargets.length > 0" class="dropdown w-full">
                    <div
                        tabindex="0"
                        role="button"
                        class="select select-bordered select-xs w-full flex items-center cursor-pointer min-h-[2rem]"
                    >
                        <span v-if="validTargets.length === 0" class="text-base-content/50">Select targets...</span>
                        <div v-else class="flex flex-wrap gap-1 w-full">
                            <span
                                v-for="targetName in validTargetsWithNames.slice(0, 3)"
                                :key="targetName"
                                class="badge badge-success badge-xs text-xs truncate max-w-[120px]"
                                :title="targetName"
                            >
                                {{ targetName }}
                            </span>
                            <span v-if="validTargets.length > 3" class="text-xs text-base-content/70 self-center">
                                +{{ validTargets.length - 3 }} more
                            </span>
                        </div>
                    </div>
                    <StopPropagationWrapper
                        tag="ul"
                        tabindex="0"
                        class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300 max-h-48 overflow-y-auto"
                    >
                        <li v-for="target in availableTargets" :key="target.id">
                            <label class="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded">
                                <input
                                    type="checkbox"
                                    :checked="isTargetSelected(target.id)"
                                    @change="toggleTarget(target.id)"
                                    class="checkbox checkbox-xs checkbox-success"
                                />
                                <div class="flex flex-col flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span class="label-text text-xs font-medium truncate">{{ target.name }}</span>
                                        <span v-if="target.isMain === true" class="badge badge-primary badge-xs">
                                            Main
                                        </span>
                                        <span
                                            v-else-if="target.isMain === false"
                                            class="badge badge-secondary badge-xs"
                                        >
                                            Relevant
                                        </span>
                                    </div>
                                    <span class="label-text text-xs text-base-content/70 truncate">{{
                                        target.description
                                    }}</span>
                                </div>
                            </label>
                        </li>
                    </StopPropagationWrapper>
                </div>

                <!-- Show message when no targets available -->
                <div v-else class="select select-bordered select-xs w-full flex items-center text-base-content/50">
                    <span>No targets available for selected method</span>
                </div>
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
