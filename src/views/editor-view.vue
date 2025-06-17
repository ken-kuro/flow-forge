<script setup>
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

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

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
</script>

<template>
  <div class="w-full h-full">
    <!-- Small screen warning -->
    <div v-if="isMobile" class="hero h-full bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-3xl font-bold">Editor Not Available on Mobile</h1>
          <p class="py-6">Please use a tablet or desktop device to create and edit flows. Mobile is currently view-only.</p>
        </div>
      </div>
    </div>

    <!-- VueFlow Editor -->
    <VueFlow v-else v-model="elements" class="w-full h-full">
      <MiniMap />
      <Controls />
    </VueFlow>
  </div>
</template> 