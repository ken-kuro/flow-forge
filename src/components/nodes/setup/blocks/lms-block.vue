<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { BookOpenText as LMSIcon } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'

/**
 * LmsBlock - A block for setting Lms type and ID in Setup nodes.
 * Allows editing of Lms type and ID.
 */
const props = defineProps({
    /**
     * The node ID this block belongs to.
     */
    nodeId: { type: String, required: true },
    /**
     * The block data object.
     * @type {{id: string, type: string, data: {lmsType: string, lmsId: string, title: string}}}
     */
    block: { type: Object, required: true },
})

const { updateBlock, flushPendingSaves } = useFlowEditor()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

const title = computed({
    get: () => props.block.data.title ?? '',
    set: (val) => {
        // eslint-disable-next-line vue/no-mutating-props
        props.block.data.title = val
        updateBlockData()
    },
})

// Local state
const lmsType = ref(props.block.data.lmsType || 'Practice')
const lmsId = ref(props.block.data.lmsId || 'practice1')

// Lms type options
const lmsTypeOptions = [
    { value: 'Practice', label: 'Practice' },
    { value: 'Conversation', label: 'Conversation' },
    { value: 'Dialogue', label: 'Dialogue' },
]

// TODO: Implement a function to get the real possible lmsId
const lmsIdOptions = {
    Practice: [{ value: 'practice1', label: 'Đúng /Sai: Ant...' }],
    Conversation: [{ value: 'conversation1', label: 'Tên conversation...' }],
    Dialogue: [{ value: 'dialogue1', label: 'Tên Dialogue...' }],
}

const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        lmsType: lmsType.value,
        lmsId: lmsId.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

// Handle type change - this needs to be immediate
const handleTypeChange = () => {
    lmsId.value = lmsIdOptions[lmsType.value][0].value
    updateBlockData(true)
}
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="LMSIcon"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter Lms title"
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

        <!-- ID Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">ID</span>
            </label>
            <select v-model="lmsId" class="select select-bordered select-xs">
                <option v-for="option in lmsIdOptions[lmsType]" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
