<script setup>
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'

const elements = ref([
  { id: '1', type: 'input', label: 'Start', position: { x: 250, y: 5 } },
  { id: '2', label: 'A node', position: { x: 100, y: 100 } },
  { id: '3', label: 'Another node', position: { x: 400, y: 100 } },
  { id: '4', type: 'output', label: 'End', position: { x: 250, y: 200 } },
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
]);

const { onPaneReady } = useVueFlow()

onPaneReady(({ fitView }) => {
  fitView()
})
</script>

<template>
  <div class="editor-container">
    <VueFlow v-model="elements" class="vue-flow-container">
      <MiniMap />
      <Controls />
    </VueFlow>
  </div>
</template>

<style>
.editor-container {
  width: 100vw;
  height: 100vh;
}
.vue-flow-container {
  width: 100%;
  height: 100%;
}
</style> 