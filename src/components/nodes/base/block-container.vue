<script setup>
/**
 * BlockContainer - Generic container for displaying blocks in a linear stack.
 * 
 * This is a pure UI container component similar to CardNodeWrapper.
 * It provides consistent styling for the "linear stack of cards" pattern
 * but doesn't know about specific block types or node logic.
 * 
 * Individual nodes are responsible for:
 * - Rendering their specific block types
 * - Providing block management UI (add/edit/delete)
 * - Managing their own block data
 */
const props = defineProps({
  /**
   * Optional empty state message
   */
  emptyMessage: {
    type: String,
    default: 'No blocks yet.',
  },
});
</script>

<template>
  <div class="block-container">
    <!-- Main Content for Blocks -->
    <div class="block-list p-2 bg-base-200/50 space-y-2">
      <slot>
        <!-- Empty state when no blocks are provided -->
        <div class="text-center text-xs text-base-content/50 py-4">
          {{ emptyMessage }}
        </div>
      </slot>
    </div>

    <!-- Footer for actions -->
    <div class="block-footer p-2 border-t-2 border-base-300">
      <slot name="footer">
        <!-- Default empty footer - nodes should provide their own management UI -->
      </slot>
    </div>
  </div>
</template>

<style scoped>
.block-container {
  /* Add any specific styles for the block container itself */
}

.unknown-block:hover {
  border-color: hsl(var(--bc) / 0.3);
}
</style> 