<script setup>
import { ref, onUnmounted, computed, watch, nextTick } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { BookOpenText as LMSIcon, X } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import { getLmsIdOptions, getLmsQuestionOptions, LMS_TYPES } from './lms.js'
import { useFlowContextStore } from '@/stores/flow-context-store.js'

/**
 * LMS Asset Block Component
 *
 * Handles LMS (Learning Management System) asset configuration within setup nodes.
 * Enforces the constraint that all LMS blocks must have the same type and question type.
 *
 * Features:
 * - LMS type selection (practice, conversation, etc.)
 * - Question configuration for practice type
 * - Automatic data fetching for LMS and question options
 * - Validation to ensure consistency across multiple LMS blocks
 *
 * @component
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
     * @type {{id: string, type: string, data: {lmsType: string, lmsData: object|null, title: string, questionData: object|null}}}
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

// Local state
const title = ref(props.block.data.title ?? 'LMS Asset')
const lmsType = ref(props.block.data.lmsType || LMS_TYPES.PRACTICE)
const lmsData = ref(props.block.data.lmsData || null)
const questionData = ref(props.block.data.questionData || null)

// Loading states
const loadingLmsOptions = ref(false)
const loadingQuestions = ref(false)

// Options data
const lmsOptions = ref([])
const questionOptions = ref([])

// Check if another LMS configuration exists and has different type
const conflictingLmsExists = computed(() => {
    const allLmsAssets = flowContextStore.setupAssets.filter((asset) => asset.type === 'asset-lms')
    const otherLms = allLmsAssets.filter((asset) => asset.id !== props.block.id)

    if (otherLms.length === 0) return false

    // Skip conflict checking if current block has no configuration (null values)
    if (!lmsType.value) return false

    // Check if any other LMS has different type or question type
    for (const other of otherLms) {
        // Skip other blocks that have no configuration
        if (!other.data?.lmsType) continue

        if (other.data.lmsType !== lmsType.value) return true
        if (other.data?.questionData?.type !== questionData.value?.type) return true
    }

    return false
})

// Check if this is the first LMS configuration
const isFirstLms = computed(() => {
    const allLmsAssets = flowContextStore.setupAssets.filter((asset) => asset.type === 'asset-lms')
    const sortedLms = allLmsAssets.sort((a, b) => a.id.localeCompare(b.id))
    return sortedLms[0]?.id === props.block.id
})

// Validation status
const lmsValidation = computed(() => {
    if (conflictingLmsExists.value) {
        return {
            isValid: false,
            message: 'All LMS blocks must have the same type and question type',
        }
    }
    return { isValid: true, message: '' }
})

// LMS type options - keeping as constant for easier maintenance and upgrades
const lmsTypeOptions = [
    { value: LMS_TYPES.PRACTICE, label: 'Practice' },
    { value: LMS_TYPES.CONVERSATION, label: 'Conversation' },
    { value: LMS_TYPES.DIALOGUE, label: 'Dialogue' },
    { value: LMS_TYPES.GAME_WHACK_A_MOLE, label: 'Game: Whack a Mole' },
    { value: LMS_TYPES.GAME_PRONUNCIATION, label: 'Game: Pronunciation' },
]

// Simulate API calls by wrapping existing functions
const fetchLmsOptions = async (type) => {
    loadingLmsOptions.value = true
    try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300))
        const options = getLmsIdOptions(type)
        return options
    } finally {
        loadingLmsOptions.value = false
    }
}

const fetchQuestionOptions = async (practiceData) => {
    if (!practiceData || !practiceData.id) return []

    loadingQuestions.value = true
    try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 200))
        const options = getLmsQuestionOptions(practiceData.id)
        return options
    } finally {
        loadingQuestions.value = false
    }
}

// Computed property to check if questions should be shown
const shouldShowQuestions = computed(() => {
    return lmsType.value === LMS_TYPES.PRACTICE && lmsData.value
})

// Initialize options when component loads
const initializeOptions = async () => {
    lmsOptions.value = await fetchLmsOptions(lmsType.value)

    // Set default lmsData if not set
    if (!lmsData.value && lmsOptions.value.length > 0) {
        lmsData.value = lmsOptions.value[0].value
    }

    // Load questions if practice type and lmsData is set
    if (lmsType.value === LMS_TYPES.PRACTICE && lmsData.value) {
        questionOptions.value = await fetchQuestionOptions(lmsData.value)
    }
}

async function handleLmsTypeChange() {
    // Analyze impact before making the change
    const impact = flowContextStore.analyzeAssetChangeImpact(props.block.id, 'lms-type-change')

    if (!flowContextStore.confirmAssetChange(impact, 'change LMS type')) {
        // User cancelled, revert the change
        lmsType.value = previousLmsType || ''
        return
    }

    // User confirmed, proceed with change
    if (impact.affectedBlocks.length > 0) {
        flowContextStore.resetAffectedBlocks(impact.affectedBlocks)
    }

    // Load new LMS options for the selected type
    lmsOptions.value = await fetchLmsOptions(lmsType.value)

    // Reset selections when type changes
    lmsData.value = lmsOptions.value.length > 0 ? lmsOptions.value[0].value : null
    questionData.value = {
        type: '',
        content: '',
    }
    questionOptions.value = []

    // If switching to practice, load questions
    if (lmsType.value === LMS_TYPES.PRACTICE && lmsData.value) {
        questionOptions.value = await fetchQuestionOptions(lmsData.value)
    }

    updateBlockData(true)
}

// Store previous LMS type to allow reverting
let previousLmsType = lmsType.value

// Watch for LMS type changes
watch(lmsType, (newType, oldType) => {
    if (oldType !== undefined && newType !== oldType) {
        previousLmsType = oldType
        // Use nextTick to allow the select to update first
        nextTick(() => {
            handleLmsTypeChange()
        })
    }
})

// Watch for lmsData changes (for practice type)
watch(lmsData, async (newLmsData) => {
    if (lmsType.value === LMS_TYPES.PRACTICE && newLmsData) {
        questionOptions.value = await fetchQuestionOptions(newLmsData)
        questionData.value = null // Reset question selection
    } else {
        questionOptions.value = []
        questionData.value = null
    }
    updateBlockData(true)
})

// Initialize on component mount
initializeOptions()

const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        lmsType: lmsType.value,
        lmsData: lmsData.value,
        questionData: questionData.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

// Handle type change - this needs to be immediate
const handleTypeChange = async () => {
    // The watch handler will take care of the logic
    // This is just for the select change event
}

// Handle question selection
const handleQuestionChange = () => {
    updateBlockData(true)
}

// Clear LMS data to resolve conflicts
const clearLmsData = () => {
    lmsType.value = null // Set to null instead of default
    lmsData.value = null
    questionData.value = null
    updateBlockData(true)
}
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="LMSIcon"
        icon-color="text-accent"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter LMS asset name"
    >
        <!-- LMS Validation Warning -->
        <div v-if="!lmsValidation.isValid" class="alert alert-error text-xs mb-2">
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
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
                <div class="flex flex-col">
                    <span>{{ lmsValidation.message }}</span>
                    <button @click="clearLmsData" class="btn btn-xs btn-error mt-1">
                        Clear configuration to resolve
                    </button>
                </div>
            </div>
        </div>

        <!-- Primary LMS Configuration Info -->
        <div v-if="isFirstLms" class="alert alert-success text-xs mb-2">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
                <span>Primary LMS configuration - other LMS blocks will follow this type</span>
            </div>
        </div>

        <!-- Flow Constraint Info -->
        <div class="alert alert-info text-xs mb-2">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
                <span>All LMS blocks in the flow must have the same type and question type</span>
            </div>
        </div>

        <!-- Type Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">LMS Type</span>
            </label>
            <select
                v-model="lmsType"
                class="select select-bordered select-xs"
                @change="handleTypeChange"
                :disabled="conflictingLmsExists"
            >
                <option v-for="option in lmsTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
            <div v-if="conflictingLmsExists" class="label">
                <span class="label-text-alt text-xs text-warning"> Disabled: Another LMS configuration exists </span>
            </div>
        </div>

        <!-- LMS Data Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs"
                    >{{ lmsType.charAt(0).toUpperCase() + lmsType.slice(1) }} Configuration</span
                >
            </label>
            <select
                v-model="lmsData"
                class="select select-bordered select-xs"
                @change="updateBlockData(true)"
                :disabled="loadingLmsOptions || conflictingLmsExists"
            >
                <option v-if="loadingLmsOptions" disabled>Loading...</option>
                <option v-else-if="lmsOptions.length === 0" disabled>No options available</option>
                <option
                    v-else
                    v-for="option in lmsOptions"
                    :key="option.value.id || option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
        </div>

        <!-- Question Selection (only for practice type) -->
        <div v-if="shouldShowQuestions" class="form-control">
            <label class="label">
                <span class="label-text text-xs">Question Configuration</span>
            </label>
            <select
                v-model="questionData"
                class="select select-bordered select-xs"
                @change="handleQuestionChange"
                :disabled="loadingQuestions || conflictingLmsExists"
            >
                <option value="null">Select a question...</option>
                <option v-if="loadingQuestions" disabled>Loading questions...</option>
                <option v-else-if="questionOptions.length === 0" disabled>No questions available</option>
                <option
                    v-else
                    v-for="option in questionOptions"
                    :key="option.value.id || option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
            <div class="label">
                <span class="label-text-alt text-xs text-base-content/50">
                    Required for practice-based interactions
                </span>
            </div>
        </div>

        <!-- Configuration Summary -->
        <div v-if="lmsData && !conflictingLmsExists" class="mt-3 p-2 bg-base-200 rounded text-xs">
            <div class="font-medium mb-1">Configuration Summary:</div>
            <div><strong>Type:</strong> {{ lmsType }}</div>
            <div v-if="lmsData.content"><strong>Content:</strong> {{ lmsData.content }}</div>
            <div v-if="questionData">
                <div><strong>Question:</strong> {{ questionData.content || 'No content' }}</div>
                <div><strong>Question Type:</strong> {{ questionData.type || 'No type' }}</div>
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
