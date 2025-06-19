<script setup>
import { Handle, Position } from '@vue-flow/core'

defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
    default: () => ({ label: 'New Branch' }),
  },
  selected: Boolean,
})
</script>

<template>
  <div
    class="condition-branch-node w-full rounded-md border bg-base-200 p-3 shadow-sm transition-colors"
    :class="{ 'border-primary': selected, 'border-base-300': !selected }"
  >
    <div class="flex items-center justify-between">
      <span class="text-sm">{{ data.label }}</span>
      <Handle
        type="source"
        :position="Position.Right"
        :id="id"
        class="!w-3 !h-3 !bg-primary"
      />
    </div>
  </div>
</template>

<style scoped>
/* Ensure the node is wide enough to be clear */
.condition-branch-node {
  min-width: 200px;
}
</style> 