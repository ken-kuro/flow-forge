<script setup>
defineProps({
  title: String,
  selected: Boolean,
});
</script>

<template>
  <div
    :class="[
      'card-node',
      'bg-base-100 border-2 border-base-300 rounded-lg shadow-md hover:shadow-lg',
      'w-80', // A good default width for card-based nodes
      'transition-all duration-200 ease-in-out',
      { 'ring-4 ring-primary ring-opacity-50': selected },
    ]"
  >
    <!-- Header Section -->
    <div class="node-header p-3 border-b-2 border-base-300 font-bold text-lg">
      <slot name="header">
        {{ title }}
      </slot>
    </div>

    <!-- Main Content -->
    <div class="node-content">
      <slot>
        <!-- Content for any card-based node goes here -->
      </slot>
    </div>
  </div>
</template>

<style scoped>
.card-node {
  /* This forces the content to respect the rounded corners of the card */
  overflow: hidden;
}

/*
  By default, handles are vertically centered. We use :deep() to target the
  child Handle components and adjust the 'default' handles for a better
  top-to-bottom flow, leaving other potential handles unaffected.
*/
:deep(.vue-flow__handle[data-handleid="default"].target) {
  top: 35%;
}

:deep(.vue-flow__handle[data-handleid="default"].source) {
  top: 65%;
}
</style> 