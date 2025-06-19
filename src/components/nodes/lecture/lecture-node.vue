<script setup>
import { Handle, Position } from '@vue-flow/core'
import CardNodeWrapper from '@/components/nodes/base/card-node-wrapper.vue'

defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
    default: () => ({ title: 'Lecture Node' }),
  },
  selected: Boolean,
})
</script>

<template>
  <CardNodeWrapper :title="data.title" :selected="selected" node-color="hsl(var(--p))">
    <Handle type="target" :position="Position.Left" />
    <div class="p-4 text-center text-sm text-base-content/70">
      Lecture blocks will be displayed here.
    </div>
    <Handle type="source" :position="Position.Right" />
  </CardNodeWrapper>
</template> 