<script setup>
import { Handle, Position } from '@vue-flow/core'

/**
 * StartNode - A simple, circular flow entry point.
 */

// Props from Vue Flow with improved type definition for `data`
const props = defineProps({
  data: {
    type: Object,
    required: true,
    // Provide a default factory function for object props
    default: () => ({ title: 'Start', config: {} })
  },
  selected: Boolean,
})

// Extract title for display, providing a default
const { title = 'Start' } = props.data || {}
</script>

<template>
  <div 
    :class="[
      'start-node',
      'bg-emerald-500 border-2 border-emerald-700 rounded-full',
      'w-16 h-16 flex items-center justify-center text-white text-sm',
      'transition-all duration-200 ease-in-out',
      { 'ring-4 ring-emerald-400 ring-opacity-70': selected },
    ]"
  >
    {{ data.title }}
    
    <!-- Single source handle, centered at the bottom -->
    <Handle 
      type="source" 
      :position="Position.Right" 
      class="!bg-emerald-700"
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