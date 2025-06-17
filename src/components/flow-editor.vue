<script setup>
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls, ControlButton } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { storeToRefs } from "pinia";
import { useFlowStore } from "@/stores/flow-store";
import { Undo, Redo } from "lucide-vue-next";

/**
 * FlowEditor - The core flow editor component
 * 
 * This component handles:
 * - Rendering the Vue Flow canvas and its parts (MiniMap, Controls, Background)
 * - Connecting to the Pinia store for state management
 * - Handling user interactions and events
 * - Will be extended to support custom nodes and sub-node architecture
 */

// --- Pinia Store Connection ---
const flowStore = useFlowStore();
const { nodes, edges } = storeToRefs(flowStore);

// --- Vue Flow Event Hooks ---
const { onConnect } = useVueFlow();

// Wire the event hooks to the store's actions
onConnect(flowStore.onConnect);

/**
 * Connection validation function
 * This prevents Vue Flow's default behavior of replacing existing connections on a handle.
 * @returns {boolean}
 */
const isValidConnection = () => true;
</script>

<template>
  <div class="flow-editor w-full h-full bg-base-300">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :is-valid-connection="isValidConnection"
      :nodes-draggable="true"
      :pan-on-scroll="true"
      fit-view-on-init
      class="vue-flow-instance"
    >
      <Background />
      <MiniMap />

      <Controls>
        <ControlButton title="Undo" @click="flowStore.undo()">
          <Undo />
        </ControlButton>
        <ControlButton title="Redo" @click="flowStore.redo()">
          <Redo />
        </ControlButton>
      </Controls>
    </VueFlow>
  </div>
</template>

<style scoped>
/* Component-specific styles can go here if needed */
.flow-editor {
  /* This will contain the editor and any future toolbars, panels, etc. */
}
</style> 