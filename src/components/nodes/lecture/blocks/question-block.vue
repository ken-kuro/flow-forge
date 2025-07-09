<script setup>
import { ref, onUnmounted, computed } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { HelpCircle } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import StopPropagationTextArea from '@/components/shared/stop-propagation-textarea.vue'

/**
 * QuestionBlock - A simplified block for questions in Lecture nodes.
 * Matches the design specifications.
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
     * @type {{id: string, type: string, data: {title: string, question: string}}}
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

// Local reactive copies for editing
const title = ref(props.block.data.title ?? 'Question')
const question = ref(props.block.data.question ?? '')

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        question: question.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="HelpCircle"
        icon-color="text-info"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter question block name"
    >
        <!-- Question Field -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Question</span>
            </label>
            <StopPropagationTextArea v-model="question" @blur="updateBlockData" placeholder="Enter your question" />
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
