<script setup>
import { ref, onUnmounted, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { useFlowEditor } from '@/composables/use-flow-editor.js'
import { GitBranch } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'

const props = defineProps({
  nodeId: {
    type: String,
    required: true,
  },
  block: {
    type: Object,
    required: true,
  },
})

const { updateBlock, flushPendingSaves } = useFlowEditor()

// Flush any pending saves when component is unmounted
// TODO: MED_PRIORITY - Improve memory management by clearing timers more aggressively
onUnmounted(() => {
  flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.label || '')
const condition = ref(props.block.data.condition || '')

// Watch for title changes and update block data immediately
watch(title, () => {
  updateBlockData()
})

// Update block data
const updateBlockData = () => {
  const newData = {
    label: title.value,
    condition: condition.value,
  }
  updateBlock(props.nodeId, props.block.id, newData)
}
</script>

<template>
  <div class="condition-branch-block relative">
          <CardBlockWrapper
        v-model="title"
        :icon="GitBranch"
        icon-color="text-primary"
      :node-id="nodeId"
      :block-id="block.id"
      placeholder="Branch label"
    >
      <!-- Condition input -->
      <!-- TODO: MED_PRIORITY - Add input validation for condition expressions -->
      <!-- TODO: MED_PRIORITY - Add syntax highlighting for condition text input -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Condition</span>
        </label>
        <input
          v-model="condition"
          @blur="updateBlockData"
          class="input input-bordered input-xs w-full"
          placeholder="e.g., score > 80"
        />
      </div>
    </CardBlockWrapper>

    <!-- Source handle for connecting to next nodes -->
    <Handle
      type="source"
      :position="Position.Right"
      :id="block.id"
      class="branch-handle"
    />
  </div>
</template>

<style scoped>
.condition-branch-block {
  position: relative;
}

/* Custom positioning for branch handles - they should be centered on the right edge */
.condition-branch-block :deep(.branch-handle) {
  right: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}
</style> 