<script setup>
import InlineEditText from '@/components/shared/inline-edit-text.vue';

defineProps({
  modelValue: String, // for v-model
  selected: Boolean,
  icon: [Object, Function], // Lucide icon component (can be Function or Object)
  iconColor: {
    type: String,
    default: 'text-primary'
  }
});

const emit = defineEmits(['update:modelValue']);

function handleTitleUpdate(newValue) {
  emit('update:modelValue', newValue);
}
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
    <div class="node-header p-3 border-b-2 border-base-300 font-bold text-lg flex items-center gap-2">
      <slot name="header">
        <component 
          v-if="icon" 
          :is="icon" 
          :class="['w-5 h-5 flex-shrink-0', iconColor]" 
        />
        <InlineEditText
          :model-value="modelValue"
          @update:modelValue="handleTitleUpdate"
          placeholder="Enter node name"
          class="w-full"
        />
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
/*
  By default, handles are vertically centered. We use :deep() to target the
  child Handle components and adjust the 'default' handles for a better
  top-to-bottom flow, leaving other potential handles unaffected.
*/
/* Custom positioning for default handles - ONLY applies to card-based nodes */
:deep(.vue-flow__handle[data-handleid="default"].target) {
  top: 35% !important;
}

:deep(.vue-flow__handle[data-handleid="default"].source) {
  top: 65% !important;
}
</style> 