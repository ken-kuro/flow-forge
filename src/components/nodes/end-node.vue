<script setup>
import { Handle, Position } from '@vue-flow/core'

/**
 * EndNode - A simple, circular flow termination point.
 * Uses DaisyUI/Catppuccin theme colors for consistency.
 */

// Props from Vue Flow with improved type definition for `data`
const props = defineProps({
  /**
   * The data object for the node.
   * @type {{title: string, config: object}}
   */
  data: {
    type: Object,
    required: true,
    // Provide a default factory function for object props
    default: () => ({ title: 'End', config: {} })
  },
  selected: Boolean,
})
</script>

<template>
  <div
    class="end-node w-16 h-16 flex items-center justify-center rounded-full border-2 bg-error text-error-content border-error-focus transition-all duration-200 ease-in-out"
    :class="{ 'ring-4 ring-error ring-opacity-70': selected }"
  >
    {{ data.title }}

    <!-- Single target handle, centered at the left -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!bg-error-content"
    />
  </div>
</template>

<style scoped>
/*
  The global handle style in main.css is now used.
  This scoped style block is removed to ensure consistency.
*/
</style> 