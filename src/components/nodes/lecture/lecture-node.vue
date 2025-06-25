<script setup>
import { ref } from 'vue';
import { Handle, Position } from '@vue-flow/core'
import CardNodeWrapper from '@/components/nodes/base/card-node-wrapper.vue'
import { useFlowEditor } from '@/composables/use-flow-editor.js';

const props = defineProps({
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

const { updateNodeData } = useFlowEditor();
const title = ref(props.data.title);

function handleTitleChange() {
  updateNodeData(props.id, { title: title.value });
}
</script>

<template>
  <CardNodeWrapper v-model="title" :selected="selected" @blur="handleTitleChange" node-color="hsl(var(--p))">
    <Handle type="target" :position="Position.Left" id="default" />
    <div class="p-4 text-center text-sm text-base-content/70">
      Lecture blocks will be displayed here.
    </div>
    <Handle type="source" :position="Position.Right" id="default" />
  </CardNodeWrapper>
</template> 