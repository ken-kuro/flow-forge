<script setup>
import { ref, onUnmounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { useFlowEditor } from '@/composables/use-flow-editor.js'
import { X, GitBranch } from 'lucide-vue-next'
import InlineEditText from '@/components/shared/inline-edit-text.vue'

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

const { updateBlock, removeBlock, flushPendingSaves } = useFlowEditor()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
  flushPendingSaves()
})

// Local reactive state
const label = ref(props.block.data.label || '')
const condition = ref(props.block.data.condition || '')

// Update block data
const updateBlockData = () => {
  const newData = {
    label: label.value,
    condition: condition.value,
  }
  updateBlock(props.nodeId, props.block.id, newData)
}

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id)
}
</script>

<template>
  <div class="condition-branch-block bg-base-100 border border-base-300 rounded-lg p-3 hover:border-base-400 transition-colors duration-200 relative">
    <!-- Block header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <GitBranch class="w-4 h-4 text-primary" />
        <InlineEditText
          v-model="label"
          @blur="updateBlockData"
          placeholder="Branch label"
          class="font-medium text-sm"
        />
      </div>
      <button
        @click="handleDelete"
        class="btn btn-ghost btn-xs text-error hover:bg-error/10"
        title="Delete branch"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Condition input -->
    <div class="mb-3">
      <label class="text-xs text-base-content/70 mb-1 block">Condition</label>
      <input
        v-model="condition"
        @blur="updateBlockData"
        class="input input-bordered input-sm w-full text-xs"
        placeholder="e.g., user_name !== '' or score > 80"
      />
    </div>

    <!-- Source handle for connecting to next nodes -->
    <Handle
      type="source"
      :position="Position.Right"
      :id="`${nodeId}-${block.id}`"
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