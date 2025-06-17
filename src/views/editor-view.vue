<script setup>
import {
  VueFlow,
  useVueFlow,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls, ControlButton } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { storeToRefs } from 'pinia'
import { useFlowStore } from '@/stores/flow-store'
import { Undo, Redo } from 'lucide-vue-next'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

/**
 * This is the core editor view.
 * It is responsible for rendering the VueFlow component and connecting it to the Pinia store.
 *
 * Architecture:
 * - The `useFlowStore` provides the state (nodes, edges).
 * - `storeToRefs` makes the state reactive so it can be passed to the VueFlow component.
 * - One-way data flow is used: `:nodes="nodes"` and `:edges="edges"`.
 * - The `useVueFlow` composable provides event hooks (`onNodesChange`, `onEdgesChange`, `onConnect`).
 * - These hooks are wired to dispatch actions to the Pinia store, which then mutates the state.
 * - The component listens for discrete user actions (`onNodeDragStop`, `onConnect`) to save the state for undo/redo.
 */

// --- Pinia Store ---
const flowStore = useFlowStore()
const { nodes, edges } = storeToRefs(flowStore)

// --- Vue Flow Event Hooks ---
// `useVueFlow` provides the context-aware hooks. Called with no parameters, it will
// automatically connect to the parent `VueFlow` component.
const { onConnect } = useVueFlow()

// Wire the event hooks to the store's actions
// With v-model, onNodesChange and onEdgesChange are handled automatically.
// We only need to handle events that require custom logic, like adding a connection.
onConnect(flowStore.onConnect)

/**
 * A simple validation function that allows all connections.
 * This prevents Vue Flow's default behavior of replacing existing connections on a handle.
 * @returns {boolean}
 */
const isValidConnection = () => true

// --- Responsive Breakpoints ---
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
</script>

<template>
  <div class="editor-container w-full h-full bg-base-300">
    <!-- Small screen warning -->
    <div v-if="isMobile" class="hero h-full bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-3xl font-bold">Editor Not Available on Mobile</h1>
          <p class="py-6">Please use a tablet or desktop device to create and edit flows.</p>
        </div>
      </div>
    </div>

    <!-- VueFlow Editor -->
    <VueFlow
      v-else
      v-model:nodes="nodes"
      v-model:edges="edges"
      :is-valid-connection="isValidConnection"
      fit-view-on-init
      class="vue-flow-instance"
    >
      <Background
        variant="lines"
        :gap="24"
        :color="'hsl(var(--bc) / 0.1)'"
      />
      <MiniMap />

      <Controls>
        <ControlButton
          title="Undo"
          @click="flowStore.undo()"
        >
          <Undo />
        </ControlButton>
        <ControlButton
          title="Redo"
          @click="flowStore.redo()"
        >
          <Redo />
        </ControlButton>
      </Controls>
    </VueFlow>
  </div>
</template> 