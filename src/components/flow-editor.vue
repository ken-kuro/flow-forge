<script setup>
import { VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { useFlowEditor } from "@/composables/use-flow-editor";
import EditorToolbar from "@/components/editor/toolbar.vue";

/**
 * FlowEditor - The core flow editor component
 * 
 * This component handles:
 * - Rendering the Vue Flow canvas with basic controls (zoom, fit, etc.)
 * - Custom application toolbar for save/load/import features
 * - Using the useFlowEditor composable for all logic
 * - Clean separation between presentation and business logic
 * - Will be extended to support custom nodes and sub-node architecture
 */

// --- Flow Editor Logic ---
// All Vue Flow interactions are handled by this composable
const { nodes, edges } = useFlowEditor();

/**
 * Connection validation function
 * This prevents Vue Flow's default behavior of replacing existing connections on a handle.
 * @returns {boolean}
 */
const isValidConnection = () => true;
</script>

<template>
  <div class="flow-editor w-full h-full bg-base-300 relative">
    <!-- Vue Flow Canvas -->
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
      
      <!-- Interactive minimap -->
      <!-- TODO: Configure it with nodeColor and nodeStrokeColor -->
      <MiniMap pannable zoomable />

      <!-- Vue Flow Basic Controls (zoom, fit, lock, etc.) -->
      <Controls position="bottom-left" />
    </VueFlow>

    <!-- Custom Application Toolbar (save, load, import, export, etc.) -->
    <EditorToolbar />
  </div>
</template>

<style scoped>
.flow-editor {
  /* This will contain the editor and any future toolbars, panels, etc. */
  position: relative;
  overflow: hidden;
}

/* Ensure Vue Flow takes full space */
.vue-flow-instance {
  width: 100%;
  height: 100%;
}
</style> 