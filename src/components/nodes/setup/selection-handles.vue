<script setup>
/**
 * SelectionHandles - Reusable component for object selection and resize handles
 * 
 * Provides consistent styling and behavior for:
 * - Selection border/outline
 * - Corner resize handles
 * - Move handle (ID tag)
 */

const props = defineProps({
  /**
   * Whether this object is currently selected
   */
  isSelected: {
    type: Boolean,
    default: false
  },
  
  /**
   * Index of the object (for display in ID tag)
   */
  index: {
    type: Number,
    required: true
  },
  
  /**
   * Type of object ('object' or 'text')
   */
  type: {
    type: String,
    default: 'object',
    validator: (value) => ['object', 'text'].includes(value)
  },
  
  /**
   * Whether to show resize handles
   */
  showResizeHandles: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['mousedown-id', 'mousedown-resize']);

const handleIdMouseDown = (event) => {
  emit('mousedown-id', event);
};

const handleResizeMouseDown = (event, handle) => {
  emit('mousedown-resize', event, handle);
};
</script>

<template>
  <!-- ID number - acts as selection handle and move handle -->
  <span 
    :class="[
      'absolute -top-1.5 -left-1.5 text-xs px-1.5 py-0.5 rounded font-medium min-w-[1.5rem] text-center select-none cursor-move pointer-events-auto',
      type === 'object' ? 'bg-error text-error-content' : 'bg-primary text-primary-content z-10'
    ]"
    data-id-tag
    @mousedown="handleIdMouseDown"
  >
    {{ index + 1 }}
  </span>
  
  <!-- Resize handles for selected object -->
  <template v-if="isSelected && showResizeHandles">
    <div 
      class="absolute w-2 h-2 bg-purple-500 border border-white cursor-nw-resize pointer-events-auto" 
      style="top: -4px; left: -4px;"
      @mousedown="(event) => handleResizeMouseDown(event, 'nw')"
    ></div>
    <div 
      class="absolute w-2 h-2 bg-purple-500 border border-white cursor-ne-resize pointer-events-auto" 
      style="top: -4px; right: -4px;"
      @mousedown="(event) => handleResizeMouseDown(event, 'ne')"
    ></div>
    <div 
      class="absolute w-2 h-2 bg-purple-500 border border-white cursor-sw-resize pointer-events-auto" 
      style="bottom: -4px; left: -4px;"
      @mousedown="(event) => handleResizeMouseDown(event, 'sw')"
    ></div>
    <div 
      class="absolute w-2 h-2 bg-purple-500 border border-white cursor-se-resize pointer-events-auto" 
      style="bottom: -4px; right: -4px;"
      @mousedown="(event) => handleResizeMouseDown(event, 'se')"
    ></div>
  </template>
</template>