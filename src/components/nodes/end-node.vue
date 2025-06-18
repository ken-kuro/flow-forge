<script setup>
import { Handle, Position } from '@vue-flow/core'

/**
 * EndNode - A simple, circular flow termination point.
 */

// Props from Vue Flow with improved type definition for `data`
const props = defineProps({
  data: {
    type: Object,
    required: true,
    // Provide a default factory function for object props
    default: () => ({ title: 'End', config: {} })
  },
  selected: Boolean,
})

// Extract title for display, providing a default
const { title = 'End' } = props.data || {}
</script>

<template>
  <div 
    :class="[
      'end-node',
      'bg-red-500 border-2 border-red-700 rounded-full',
      'w-16 h-16 flex items-center justify-center text-white text-sm',
      'transition-all duration-200 ease-in-out',
      { 'ring-4 ring-red-400 ring-opacity-70': selected },
    ]"
  >
    {{ data.title }}
    
    <!-- Single target handle, centered at the top -->
    <Handle 
      type="target" 
      :position="Position.Left"
      class="!bg-red-700"
    />
  </div>
</template>

<style scoped>
/* Ensure handles are visible and properly styled on the circular node */
.vue-flow__handle {
  width: 10px;
  height: 10px;
  border-radius: 100%;
  border-width: 2px;
}
</style> 