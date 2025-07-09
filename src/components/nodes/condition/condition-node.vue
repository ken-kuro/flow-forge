<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Plus, GitBranch } from 'lucide-vue-next'
import CardNodeWrapper from '@/components/nodes/base/card-node-wrapper.vue'
import BlockContainer from '@/components/nodes/base/block-container.vue'
import { useFlowEditor } from '@/composables/use-flow-editor.js'
import ConditionBranchBlock from './condition-branch-block.vue'

const props = defineProps({
    id: {
        type: String,
        required: true,
    },
    data: {
        type: Object,
        required: true,
        default: () => ({ title: 'Condition' }),
    },
    selected: Boolean,
})

const { addBlock, getNodeBlocks, updateNodeData } = useFlowEditor()

const title = computed({
    get: () => props.data.title,
    set: (newTitle) => {
        updateNodeData(props.id, { title: newTitle })
    },
})

// TODO: HIGH_PRIORITY - Add error boundary wrapper to handle malformed branch data
// TODO: HIGH_PRIORITY - Add error handling for Vue Flow edge creation failures

// Get condition branches (stored as blocks)
const blocks = computed(() => getNodeBlocks(props.id))

function handleAddBranch() {
    const branchCount = blocks.value.length + 1
    const blockData = {
        type: 'condition-branch',
        data: {
            label: `Branch #${branchCount}`,
            condition: '',
        },
    }
    addBlock(props.id, blockData)
}
</script>

<template>
    <CardNodeWrapper v-model="title" :selected="selected" :icon="GitBranch" icon-color="text-warning">
        <!-- Input handle -->
        <Handle type="target" :position="Position.Left" id="default" />

        <BlockContainer empty-message="No condition branches yet. Add one below.">
            <!-- Render condition branch blocks -->
            <template v-if="blocks.length > 0">
                <ConditionBranchBlock v-for="block in blocks" :key="block.id" :node-id="id" :block="block" />
            </template>

            <!-- Add branch button -->
            <template #footer>
                <button @click="handleAddBranch" class="btn btn-sm btn-outline btn-primary w-full">
                    <Plus class="w-4 h-4" />
                    Add Branch
                </button>
            </template>
        </BlockContainer>

        <!-- Note: No source handle on the main node - branches provide their own source handles -->
    </CardNodeWrapper>
</template>
