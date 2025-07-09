<script setup>
import { ref, onUnmounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { useFlowEditor } from '@/composables/use-flow-editor.js'
import { GitBranch as BranchIcon } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'

/**
 * ConditionBranchBlock - A block for defining the condition branch in Condition nodes.
 * Allow editing the condition expression.
 */
// TODO: THIS_APPLY_FOR_ALL_BLOCKS - Find a better way to define props, reuse generic props like nodeId, blockId, blockType, etc.
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
     * @type {{id: string, type: string, data: {title: string, condition: string}}}
     */
    block: {
        type: Object,
        required: true,
    },
})

const { updateBlock, flushPendingSaves } = useFlowEditor()

// Flush any pending saves when component is unmounted
// TODO: MED_PRIORITY - Improve memory management by clearing timers more aggressively
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.title ?? '')
const condition = ref(props.block.data.condition ?? '')

const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        condition: condition.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
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
            <!-- Condition input -->
            <!-- TODO: MED_PRIORITY - Add input validation for condition expressions -->
            <!-- TODO: MED_PRIORITY - Add syntax highlighting for condition text input -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Condition</span>
                </label>
                <input
                    v-model="condition"
                    @blur="updateBlockData"
                    type="text"
                    placeholder="e.g., age > 18"
                    class="input input-bordered input-xs"
                />
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
