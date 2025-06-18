<template>
  <div class="block-container">
    <!-- Main Content for Blocks -->
    <div class="block-list p-2 bg-base-200/50 space-y-2">
      <slot>
        <div class="text-center text-xs text-base-content/50 py-4">
          No blocks yet.
        </div>
      </slot>
    </div>

    <!-- Footer for actions -->
    <div class="block-footer p-2 border-t-2 border-base-300">
      <slot name="footer">
        <!-- "Add Block" buttons will go here -->
      </slot>
    </div>
  </div>
</template>

<style scoped>
.block-container {
  /* Add any specific styles for the block container itself */
}
</style> 