<script setup>
import { ref, onUnmounted, computed, watch } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { BookOpenText as LMSIcon, X } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import { getLmsIdOptions, getLmsQuestionOptions } from './lms.js'

/**
 * LmsAssetBlock - A block for defining LMS assets in Setup nodes.
 * Stores complete data objects for practice/conversation/dialogue and questions.
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

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local state
const title = ref(props.block.data.title ?? 'LMS Asset')
const lmsType = ref(props.block.data.lmsType || 'practice')
const lmsData = ref(props.block.data.lmsData || null)
const questionData = ref(props.block.data.questionData || null)

// Loading states
const loadingLmsOptions = ref(false)
const loadingQuestions = ref(false)

// Options data
const lmsOptions = ref([])
const questionOptions = ref([])

// LMS type options - keeping as constant for easier maintenance and upgrades
const lmsTypeOptions = [
    { value: 'practice', label: 'Practice' },
    { value: 'conversation', label: 'Conversation' },
    { value: 'dialogue', label: 'Dialogue' },
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
    return lmsType.value === 'practice' && lmsData.value
})

// Initialize options when component loads
const initializeOptions = async () => {
    lmsOptions.value = await fetchLmsOptions(lmsType.value)

    // Set default lmsData if not set
    if (!lmsData.value && lmsOptions.value.length > 0) {
        lmsData.value = lmsOptions.value[0].value
    }

    // Load questions if practice type and lmsData is set
    if (lmsType.value === 'practice' && lmsData.value) {
        questionOptions.value = await fetchQuestionOptions(lmsData.value)
    }
}

// Watch for lmsType changes
watch(lmsType, async (newType) => {
    lmsOptions.value = await fetchLmsOptions(newType)

    // Reset selections when type changes
    lmsData.value = lmsOptions.value.length > 0 ? lmsOptions.value[0].value : null
    questionData.value = null
    questionOptions.value = []

    // If switching to practice, load questions
    if (newType === 'practice' && lmsData.value) {
        questionOptions.value = await fetchQuestionOptions(lmsData.value)
    }

    updateBlockData(true)
})

// Watch for lmsData changes (for practice type)
watch(lmsData, async (newLmsData) => {
    if (lmsType.value === 'practice' && newLmsData) {
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
        <!-- Type Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Type</span>
            </label>
            <select v-model="lmsType" class="select select-bordered select-xs" @change="handleTypeChange">
                <option v-for="option in lmsTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>

        <!-- LMS Data Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">{{ lmsType.charAt(0).toUpperCase() + lmsType.slice(1) }}</span>
            </label>
            <select
                v-model="lmsData"
                class="select select-bordered select-xs"
                @change="updateBlockData(true)"
                :disabled="loadingLmsOptions"
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
                <span class="label-text text-xs">Question</span>
            </label>
            <select
                v-model="questionData"
                class="select select-bordered select-xs"
                @change="handleQuestionChange"
                :disabled="loadingQuestions"
            >
                <option :value="null">Select a question (optional)</option>
                <option v-if="loadingQuestions" disabled>Loading questions...</option>
                <option v-else-if="questionOptions.length === 0" disabled>No questions available</option>
                <option v-else v-for="option in questionOptions" :key="option.value.id" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
