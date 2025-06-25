<script setup>
import InlineEditText from '@/components/shared/inline-edit-text.vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X } from 'lucide-vue-next';

/**
 * CardBlockWrapper - Consistent wrapper for all blocks
 * 
 * Provides the same benefits for blocks that CardNodeWrapper provides for nodes:
 * - Consistent styling and spacing
 * - Standardized header with icon and inline edit
 * - Built-in delete functionality
 * - Hover effects and responsive design
 */

const props = defineProps({
  /**
   * Block title for v-model
   */
  modelValue: {
    type: String,
    default: ''
  },
  
  /**
   * Icon component (Lucide icon)
   */
  icon: {
    type: [Object, Function],
    required: true
  },
  
  /**
   * Icon color class
   */
  iconColor: {
    type: String,
    default: 'text-accent'
  },
  
  /**
   * Node ID for delete functionality
   */
  nodeId: {
    type: String,
    required: true
  },
  
  /**
   * Block ID for delete functionality
   */
  blockId: {
    type: String,
    required: true
  },
  
  /**
   * Placeholder text for title input
   */
  placeholder: {
    type: String,
    default: 'Enter block name'
  }
});

const emit = defineEmits(['update:modelValue']);

const { removeBlock } = useFlowEditor();

function handleTitleUpdate(newValue) {
  emit('update:modelValue', newValue);
}

function handleDelete() {
  removeBlock(props.nodeId, props.blockId);
}
</script>

<template>
  <div class="card-block bg-base-100 border border-base-300 rounded-lg p-3 space-y-3 transition-all duration-200 ease-in-out hover:border-base-content/30">
    <!-- Block Header -->
    <div class="block-header flex items-center justify-between">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <component 
          :is="icon" 
          :class="['w-4 h-4 flex-shrink-0', iconColor]" 
        />
        <InlineEditText
          :model-value="modelValue"
          @update:modelValue="handleTitleUpdate"
          :placeholder="placeholder"
          class="text-sm font-medium flex-1"
        />
      </div>
      <button
        @click="handleDelete"
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content flex-shrink-0"
        title="Delete Block"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Block Content -->
    <div class="block-content">
      <slot>
        <!-- Block-specific content goes here -->
      </slot>
    </div>
  </div>
</template>

<style scoped>
.card-block {
  /* Additional block-specific styles can be added here */
}

/* Ensure content doesn't overflow */
.block-content {
  min-width: 0; /* Allow flex items to shrink below content size */
}
</style> 