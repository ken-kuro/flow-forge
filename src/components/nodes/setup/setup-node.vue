<script setup>
import { computed, ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import CardNodeWrapper from '@/components/nodes/base/card-node-wrapper.vue'
import BlockContainer from '@/components/nodes/base/block-container.vue'
import { useFlowEditor } from '@/composables/use-flow-editor.js'

// Setup-specific block imports
import VariableBlock from './blocks/variable-block.vue'
import ImageAssetBlock from './blocks/image-asset-block.vue'
import VideoAssetBlock from './blocks/video-asset-block.vue'

/**
 * SetupNode - A container node for defining initial configuration blocks.
 * This node will hold items like 'Set Variable' or 'Initial Prompt'.
 * 
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
  /**
   * The data object for the node.
   * @type {{title: string, config: object}}
   */
  data: {
    type: Object,
    required: true,
    default: () => ({ title: 'Setup', config: {} }),
  },
  selected: Boolean,
})

const { addBlock, getNodeBlocks, updateNodeData } = useFlowEditor()

const title = ref(props.data.title);

const blocks = computed(() => getNodeBlocks(props.id))

const availableBlocks = [
  { type: 'variable', label: 'Variable', description: 'Define a typed variable' },
  { type: 'asset-image', label: 'Image Asset', description: 'Reference an image' },
  { type: 'asset-video', label: 'Video Asset', description: 'Reference a video' },
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

function handleTitleChange() {
  updateNodeData(props.id, { title: title.value });
}
</script>

<template>
  <CardNodeWrapper v-model="title" :selected="selected" @blur="handleTitleChange">
    <!-- Input handle on the left, named 'default' for specific styling -->
    <Handle type="target" :position="Position.Left" id="default" class="!bg-base-content"/>

    <BlockContainer empty-message="No setup blocks yet. Add one below.">
      <!-- Render blocks based on their type -->
      <template v-if="blocks.length > 0">
        <template v-for="block in blocks" :key="block.id">
          <!-- Variable Block -->
          <VariableBlock
            v-if="block.type === 'variable'"
            :node-id="id"
            :block="block"
          />

          <!-- Image Asset Block -->
          <ImageAssetBlock
            v-else-if="block.type === 'asset-image'"
            :node-id="id"
            :block="block"
          />

          <!-- Video Asset Block -->
          <VideoAssetBlock
            v-else-if="block.type === 'asset-video'"
            :node-id="id"
            :block="block"
          />

          <!-- Unknown block type fallback -->
          <div v-else class="unknown-block bg-warning/20 border border-warning rounded-lg p-3">
            <div class="text-sm text-warning">
              Unknown block type: {{ block.type }}
            </div>
          </div>
        </template>
      </template>

      <!-- The footer slot contains action buttons -->
      <template #footer>
        <!-- Add Block Dropdown -->
        <!-- TODO: Add keyboard navigation (arrow keys, enter, escape) for better accessibility -->
        <div class="dropdown dropdown-bottom dropdown-end w-full">
          <div
            tabindex="0"
            role="button"
            class="btn btn-sm btn-outline btn-primary w-full"
          >
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

    <!-- Output handle on the right, named 'default' for specific styling -->
    <Handle type="source" :position="Position.Right" id="default" class="!bg-base-content"/>
  </CardNodeWrapper>
</template>

<style scoped>
/* Scoped styles specific to the SetupNode can be added here if needed */
.unknown-block:hover {
  border-color: hsl(var(--bc) / 0.3);
}
</style> 