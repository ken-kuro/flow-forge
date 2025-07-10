<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { GraduationCap } from 'lucide-vue-next'
import CardNodeWrapper from '@/components/nodes/base/card-node-wrapper.vue'
import BlockContainer from '@/components/nodes/base/block-container.vue'
import { useFlowEditor } from '@/composables/use-flow-editor.js'

// Lecture-specific block imports
import TeacherVideoBlock from './blocks/teacher-video-block.vue'
import AssetsAppliedBlock from './blocks/assets-applied-block.vue'
import CollectUserDataBlock from '@/components/nodes/lecture/blocks/collect-user-data-block.vue'
import SystemActionBlock from '@/components/nodes/lecture/blocks/system-action-block.vue'
import AudioBlock from '@/components/nodes/lecture/blocks/audio-block.vue'

/**
 * LectureNode - A container node for content delivery and interaction.
 * This node holds various content blocks like videos, questions, and system actions.
 */
const props = defineProps({
    id: {
        type: String,
        required: true,
    },
    /**
     * The data object for the node.
     * @type {{title: string, config: object}}
     */
    data: {
        type: Object,
        required: true,
        default: () => ({ title: 'Lecture', config: {} }),
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

const blocks = computed(() => getNodeBlocks(props.id))

const availableBlocks = [
    { type: 'teacher-video', label: 'Teacher Video', description: 'Video content with controls' },
    { type: 'assets-applied', label: 'Assets Applied', description: 'Reference setup node assets' },
    { type: 'collect-user-data', label: 'Collect User Data', description: 'Gather user responses' },
    { type: 'system-action', label: 'System Action', description: 'Execute system operations' },
    { type: 'audio', label: 'Audio', description: 'Audio content' },
]

function handleAddBlock(blockType) {
    const blockData = {
        type: blockType,
        data: {},
    }
    addBlock(props.id, blockData)
    // Close the dropdown after adding
    if (document.activeElement) {
        document.activeElement.blur()
    }
}
</script>

<template>
    <CardNodeWrapper v-model="title" :selected="selected" :icon="GraduationCap" icon-color="text-secondary">
        <!-- Input handle on the left -->
        <Handle type="target" :position="Position.Left" id="default" />

        <BlockContainer empty-message="No lecture blocks yet. Add content below.">
            <!-- Render blocks based on their type -->
            <template v-if="blocks.length > 0">
                <template v-for="block in blocks" :key="block.id">
                    <!-- Teacher Video Block -->
                    <TeacherVideoBlock v-if="block.type === 'teacher-video'" :node-id="id" :block="block" />

                    <!-- Assets Applied Block -->
                    <AssetsAppliedBlock v-else-if="block.type === 'assets-applied'" :node-id="id" :block="block" />

                    <!-- Collect User Data Block -->
                    <CollectUserDataBlock v-else-if="block.type === 'collect-user-data'" :node-id="id" :block="block" />

                    <!-- System Action Block -->
                    <SystemActionBlock v-else-if="block.type === 'system-action'" :node-id="id" :block="block" />

                    <!-- Audio Block -->
                    <AudioBlock v-else-if="block.type === 'audio'" :node-id="id" :block="block" />

                    <!-- Unknown block type fallback -->
                    <div v-else class="unknown-block bg-warning/20 border border-warning rounded-lg p-3">
                        <div class="text-sm text-warning">Unknown block type: {{ block.type }}</div>
                    </div>
                </template>
            </template>

            <!-- The footer slot contains action buttons -->
            <template #footer>
                <!-- Add Block Dropdown -->
                <div class="dropdown dropdown-bottom dropdown-end w-full">
                    <div tabindex="0" role="button" class="btn btn-sm btn-outline btn-primary w-full">
                        <span class="icon-[mdi--plus]"></span>
                        Add Block
                    </div>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full">
                        <li v-for="blockDef in availableBlocks" :key="blockDef.type">
                            <a @click="handleAddBlock(blockDef.type)">
                                <span class="font-bold">{{ blockDef.label }}</span>
                                <span class="text-xs text-base-content/70">{{ blockDef.description }}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </template>
        </BlockContainer>

        <!-- Output handle on the right -->
        <Handle type="source" :position="Position.Right" id="default" />
    </CardNodeWrapper>
</template>

<style scoped>
/* Scoped styles specific to the LectureNode can be added here if needed */
.unknown-block:hover {
    border-color: hsl(var(--bc) / 0.3);
}
</style>
