<script setup>
import { Handle, Position } from '@vue-flow/core';
import CardNodeWrapper from './base/card-node-wrapper.vue';
import BlockContainer from './blocks/block-container.vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { computed } from 'vue';

/**
 * SetupNode - A container node for defining initial configuration blocks.
 * This node will hold items like 'Set Variable' or 'Initial Prompt'.
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
});

const { getNodeBlocks, addBlock } = useFlowEditor();

// Get the blocks for this specific node instance
const blocks = computed(() => getNodeBlocks(props.id));

const handleAddBlock = () => {
  // Create a new block with a default structure
  const newBlock = {
    // A unique ID will be added by the store action
    type: 'variable', // Example block type
    data: {
      name: 'newVar',
      value: 'hello world',
    },
  };
  addBlock(props.id, newBlock);
};
</script>

<template>
  <CardNodeWrapper :title="data.title" :selected="selected">
    <!-- Input handle on the left, named 'default' for specific styling -->
    <Handle type="target" :position="Position.Left" id="default" class="!bg-base-content" />

    <BlockContainer>
      <!-- The main slot will render the list of blocks -->
      <template #default>
        <div v-if="blocks && blocks.length > 0" class="space-y-2">
          <div v-for="block in blocks" :key="block.id" class="p-2 bg-base-100 rounded-md text-xs">
            <!-- This is a placeholder rendering of a block -->
            <strong>{{ block.type }}:</strong> {{ block.data.name }} = {{ block.data.value }}
          </div>
        </div>
        <div v-else class="text-center text-xs text-base-content/50 py-4">
          No setup blocks yet.
        </div>
      </template>

      <!-- The footer slot contains action buttons -->
      <template #footer>
        <button @click="handleAddBlock" class="btn btn-xs btn-ghost w-full">
          + Add Setup Block
        </button>
      </template>
    </BlockContainer>

    <!-- Output handle on the right, named 'default' for specific styling -->
    <Handle type="source" :position="Position.Right" id="default" class="!bg-base-content" />
  </CardNodeWrapper>
</template>

<style scoped>
/* Scoped styles specific to the SetupNode can be added here if needed */
</style> 