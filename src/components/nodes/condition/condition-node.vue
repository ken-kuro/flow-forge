<script setup>
import { computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import CardNodeWrapper from '@/components/nodes/base/card-node-wrapper.vue'
import { useFlowEditor } from '@/composables/use-flow-editor.js'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
    default: () => ({ title: 'Condition' }),
  },
  selected: Boolean,
})

const { addChildNode, getNode } = useFlowEditor()
const { getNodes } = useVueFlow()

// Find all branch nodes that belong to this condition node
const childBranches = computed(() =>
  getNodes.value.filter(n => n.parentNode === props.id && n.type === 'condition-branch')
)

function handleAddBranch() {
  const newBranchData = {
    type: 'condition-branch',
    data: {
      label: `Branch #${childBranches.value.length + 1}`
    }
  }
  addChildNode(props.id, newBranchData)
}
</script>

<template>
  <!-- The `vue-flow__node-inside` class is used by Vue Flow to correctly position child nodes -->
  <CardNodeWrapper
    :title="data.title"
    :selected="selected"
    node-color="hsl(var(--a))"
    class="vue-flow__node-inside"
  >
    <Handle type="target" :position="Position.Left" />

    <!--
      This is the container for the nested branch nodes.
      Vue Flow will automatically render child nodes here.
      We add our own list for adding a footer and empty states.
    -->
    <div class="space-y-2 p-2 min-w-[220px]">
      <div v-if="childBranches.length === 0" class="text-center text-xs text-base-content/60 py-4">
        No branches yet. Add one below.
      </div>

      <!-- Child nodes will be rendered by Vue Flow above this point -->
    </div>

    <!-- Footer for actions -->
    <div class="border-t border-base-300 p-2">
      <button
        @click="handleAddBranch"
        class="btn btn-sm btn-outline btn-primary w-full"
      >
        <span class="icon-[mdi--plus]"></span>
        Add Branch
      </button>
    </div>

    <!--
      A Condition Node itself does not have a direct output.
      The outputs come from the individual branches within it.
    -->
  </CardNodeWrapper>
</template> 