<script setup>
import { ref, onUnmounted, computed, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { useFlowEditor } from '@/composables/use-flow-editor.js'
import { GitBranch as BranchIcon } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import { useFlowContextStore } from '@/stores/flow-context-store.js'
import { getConditionBranch } from '@/utils/flow-context-filtering.js'

/**
 * ConditionBranchBlock - A context-aware block for defining condition branches in Condition nodes.
 * Uses flow context filtering to show only relevant condition options based on LMS asset configuration.
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
     * @type {{id: string, type: string, data: {title: string, condition: string, cup: number}}}
     */
    block: {
        type: Object,
        required: true,
    },
})

const { updateBlock, flushPendingSaves, getNodeBlocks } = useFlowEditor()
const flowContextStore = useFlowContextStore()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.title ?? '')
const condition = ref(props.block.data.condition ?? '')
const cup = ref(props.block.data.cup ?? 0)
const inputMode = ref(props.block.data.inputMode ?? 'predefined') // 'predefined' or 'manual'

// Get available conditions for current context only
const availableConditions = computed(() => {
    const lmsType = flowContextStore.lmsType
    const questionType = flowContextStore.questionType
    const objects = flowContextStore.objects

    if (!lmsType) return []

    // Show conditions available for CURRENT context only
    return getConditionBranch(lmsType, questionType, objects)
})

// Check if we have valid context
const hasValidContext = computed(() => {
    return flowContextStore.lmsType !== null
})

// Detect conflicts with other condition branch blocks
const conflictWarning = computed(() => {
    if (!hasValidContext.value || !condition.value || inputMode.value === 'manual') return null

    // Check if another condition branch block in the same node already uses this condition
    const allConditionBlocks = getNodeBlocks(props.nodeId).filter(
        (block) => block.type === 'condition-branch' && block.id !== props.block.id,
    )

    const duplicateCondition = allConditionBlocks.find((block) => block.data.condition === condition.value)

    if (duplicateCondition) {
        return `This condition is already used by another branch: "${duplicateCondition.data.title}"`
    }

    return null
})

// Get the selected condition object (for predefined mode)
const selectedCondition = computed(() => {
    if (inputMode.value === 'manual' || !condition.value) return null
    return availableConditions.value.find((c) => c.value === condition.value) || null
})

// Handle input mode change
const handleInputModeChange = () => {
    if (inputMode.value === 'predefined') {
        // Reset to empty when switching to predefined
        condition.value = ''
        cup.value = 0
    }
    updateBlockData(true)
}

// Watch for context changes and reset invalid conditions
watch(
    [() => flowContextStore.lmsType, () => flowContextStore.questionType, () => flowContextStore.objects],
    () => {
        if (inputMode.value === 'predefined' && condition.value) {
            // Check if current condition is still available in new context
            const currentConditions = availableConditions.value
            const isStillValid = currentConditions.some((c) => c.value === condition.value)

            if (!isStillValid) {
                // Reset condition if no longer valid
                condition.value = ''
                cup.value = 0
                updateBlockData(true)
            }
        }
    },
    { immediate: true },
)

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        condition: condition.value,
        cup: cup.value,
        inputMode: inputMode.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

// Handle predefined condition selection
const handleConditionSelect = (conditionValue) => {
    const selectedCond = availableConditions.value.find((c) => c.value === conditionValue)
    if (selectedCond) {
        condition.value = selectedCond.value
        cup.value = selectedCond.cup
        // Update title if it's empty or default
        if (!title.value || title.value.startsWith('Branch #')) {
            title.value = selectedCond.label
        }
        updateBlockData(true)
    }
}
</script>

<template>
    <div class="condition-branch-block relative">
        <CardBlockWrapper
            v-model="title"
            :icon="BranchIcon"
            icon-color="text-primary"
            :node-id="nodeId"
            :block-id="block.id"
            placeholder="Branch title"
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

            <!-- Input Mode Selection -->
            <div class="form-control mb-2">
                <div class="flex gap-4">
                    <label class="label cursor-pointer justify-start gap-2">
                        <input
                            type="radio"
                            v-model="inputMode"
                            value="predefined"
                            @change="handleInputModeChange"
                            class="radio radio-xs radio-primary"
                        />
                        <span class="label-text text-xs">Predefined</span>
                    </label>
                    <label class="label cursor-pointer justify-start gap-2">
                        <input
                            type="radio"
                            v-model="inputMode"
                            value="manual"
                            @change="handleInputModeChange"
                            class="radio radio-xs radio-primary"
                        />
                        <span class="label-text text-xs">Manual</span>
                    </label>
                </div>
            </div>

            <!-- Predefined Condition Selection -->
            <div v-if="inputMode === 'predefined'" class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Condition</span>
                </label>

                <!-- Show conditions dropdown when context is valid -->
                <div v-if="hasValidContext && availableConditions.length > 0">
                    <select
                        :value="condition"
                        @change="handleConditionSelect($event.target.value)"
                        class="select select-bordered select-xs"
                    >
                        <option value="">Select a condition...</option>
                        <option v-for="cond in availableConditions" :key="cond.value" :value="cond.value">
                            {{ cond.label }}
                        </option>
                    </select>

                    <!-- Show selected condition details -->
                    <div v-if="selectedCondition" class="mt-2 p-2 bg-base-200 rounded text-xs">
                        <div><strong>Description:</strong> {{ selectedCondition.description }}</div>
                        <div><strong>Cup Value:</strong> {{ selectedCondition.cup }}</div>
                        <div class="mt-1 font-mono text-xs bg-base-300 p-1 rounded">
                            {{ selectedCondition.value }}
                        </div>
                    </div>
                </div>

                <!-- Show message when no context or conditions available -->
                <div v-else class="select select-bordered select-xs w-full flex items-center text-base-content/50">
                    <span v-if="!hasValidContext"> Configure LMS asset in setup node first </span>
                    <span v-else> No condition branches available for this LMS configuration </span>
                </div>
            </div>

            <!-- Manual Condition Input -->
            <div v-else class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Condition Expression</span>
                </label>
                <input
                    v-model="condition"
                    @blur="updateBlockData"
                    type="text"
                    placeholder="e.g., user_answer > 60"
                    class="input input-bordered input-xs"
                />
                <div class="label">
                    <span class="label-text-alt text-xs text-base-content/50">
                        Enter a custom condition expression
                    </span>
                </div>
            </div>
        </CardBlockWrapper>

        <!-- Source handle for connecting to next nodes -->
        <Handle type="source" :position="Position.Right" :id="block.id" class="branch-handle" />
    </div>
</template>

<style scoped>
.condition-branch-block {
    position: relative;
}

/* Custom positioning for branch handles - they should be centered on the right edge */
.condition-branch-block :deep(.branch-handle) {
    right: -6px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
}
</style>
