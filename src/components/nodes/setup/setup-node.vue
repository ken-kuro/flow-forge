<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Settings } from 'lucide-vue-next'
import CardNodeWrapper from '@/components/nodes/base/card-node-wrapper.vue'
import BlockContainer from '@/components/nodes/base/block-container.vue'
import { useFlowEditor } from '@/composables/use-flow-editor.js'
import { useFlowContextStore } from '@/stores/flow-context-store.js'

// Setup-specific block imports
import ImageAssetBlock from './blocks/image-asset-block.vue'
import VideoAssetBlock from './blocks/video-asset-block.vue'
import LMSAssetBlock from './blocks/lms-asset-block.vue'

/**
 * SetupNode - The single setup node for defining all flow assets.
 * In the simplified context-aware asset system, each flow has exactly one setup node
 * containing all asset configurations with specific constraints.
 * TODO: Future improvements for Phase 2 polish:
 * - Add drag-and-drop reordering of blocks
 * - Add keyboard shortcuts for adding blocks (Ctrl+Shift+V for variable, etc.)
 * - Add block duplication functionality
 * - Improve block validation and error states
 * - Add block collapse/expand for large configurations
 * - Add search/filter for block types when list grows
 */
const props = defineProps({
    id: {
        type: String,
        required: true,
    },
    data: {
        type: Object,
        required: true,
    },
    selected: Boolean,
})

const { addBlock, getNodeBlocks, updateNodeData } = useFlowEditor()
const flowContextStore = useFlowContextStore()

const title = computed({
    get: () => props.data.title,
    set: (newTitle) => {
        updateNodeData(props.id, { title: newTitle })
    },
})

const blocks = computed(() => getNodeBlocks(props.id))

// Get validation results from the flow context store
const validation = computed(() => flowContextStore.validationResult)

// Check if this is the primary setup node (first one found)
const isPrimarySetupNode = computed(() => {
    return flowContextStore.setupNode?.id === props.id
})

// Asset block constraints
const availableBlocks = [
    { type: 'asset-image', label: 'Image Asset', description: 'Reference an image with optional elements' },
    { type: 'asset-video', label: 'Video Asset', description: 'Reference a video' },
    { type: 'asset-lms', label: 'LMS Asset', description: 'Configure LMS type and questions' },
]

function handleAddBlock(blockType) {
    // Validate if this block can be added
    const validationResult = flowContextStore.validateAssetAddition(blockType, {})

    if (!validationResult.isValid) {
        alert(`Cannot add ${blockType}: ${validationResult.errors.join(', ')}`)
        return
    }

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
    <CardNodeWrapper v-model="title" :selected="selected" :icon="Settings" icon-color="text-primary">
        <!-- Input handle on the left, named 'default' for specific styling -->
        <Handle type="target" :position="Position.Left" id="default" />

        <!-- Validation Alerts -->
        <div v-if="!validation.isValid" class="mb-3">
            <div v-for="error in validation.errors" :key="error" class="alert alert-error text-xs mb-1">
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
                    <span>{{ error }}</span>
                </div>
            </div>
        </div>

        <!-- Secondary Setup Node Warning -->
        <div v-if="!isPrimarySetupNode" class="alert alert-warning text-xs mb-3">
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
                <span>Multiple setup nodes detected - only the first one will be used</span>
            </div>
        </div>

        <BlockContainer empty-message="No setup blocks yet. Add one below.">
            <!-- Render blocks based on their type -->
            <template v-if="blocks.length > 0">
                <template v-for="block in blocks" :key="block.id">
                    <!-- Image Asset Block -->
                    <ImageAssetBlock v-if="block.type === 'asset-image'" :node-id="id" :block="block" />

                    <!-- Video Asset Block -->
                    <VideoAssetBlock v-else-if="block.type === 'asset-video'" :node-id="id" :block="block" />

                    <!-- LMS Asset Block -->
                    <LMSAssetBlock v-else-if="block.type === 'asset-lms'" :node-id="id" :block="block" />

                    <!-- Unknown block type fallback -->
                    <div v-else class="unknown-block bg-warning/20 border border-warning rounded-lg p-3">
                        <div class="text-sm text-warning">Unknown block type: {{ block.type }}</div>
                    </div>
                </template>
            </template>

            <!-- The footer slot contains action buttons -->
            <template #footer>
                <!-- Add Block Dropdown -->
                <!-- TODO: Add keyboard navigation (arrow keys, enter, escape) for better accessibility -->
                <div class="dropdown dropdown-bottom dropdown-end w-full">
                    <div tabindex="0" role="button" class="btn btn-sm btn-outline btn-primary w-full">
                        <span class="icon-[mdi--plus]"></span>
                        Add Block
                    </div>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full">
                        <li v-for="blockType in availableBlocks" :key="blockType.type">
                            <a @click="handleAddBlock(blockType.type)">
                                <span class="font-bold">{{ blockType.label }}</span>
                                <span class="text-xs text-base-content/70">{{ blockType.description }}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </template>
        </BlockContainer>

        <!-- Output handle on the right, named 'default' for specific styling -->
        <Handle type="source" :position="Position.Right" id="default" />
    </CardNodeWrapper>
</template>

<style scoped>
/* Scoped styles specific to the SetupNode can be added here if needed */
.unknown-block:hover {
    border-color: hsl(var(--bc) / 0.3);
}
</style>
