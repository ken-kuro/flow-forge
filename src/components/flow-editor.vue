<script setup>

import { VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { useFlowEditor } from "@/composables/use-flow-editor.js";
import { onMounted } from 'vue';
import EditorToolbar from "@/components/editor/toolbar.vue";
import ModalManager from "@/components/modal-manager.vue";

// Import custom node registry
import { nodeTypes } from "@/components/nodes";

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
const { nodes, edges, initFlowEvents } = useFlowEditor();

// Initialize the event handlers for the flow editor instance.
// This is called only once to prevent duplicate event listener registration.
onMounted(() => {
  initFlowEvents();
});

/**
 * Connection validation function
 * This prevents Vue Flow's default behavior of replacing existing connections on a handle.
 * @returns {boolean}
 */
const isValidConnection = () => true;
</script>

<template>
  <div class="flow-editor h-full w-full bg-base-300 relative overflow-hidden">
    <!-- Vue Flow Canvas -->
    <!-- TODO: Allow passing the config to the VueFlow component -->
    <!--
      CONTROLLED FLOW CONFIGURATION
      -----------------------------------------
      We are using a "controlled flow" with:
      1. `:apply-default="false"` - Disables automatic change handling
      2. Manual change handlers in `useFlowEditor` that intercept and validate changes
      3. Changes applied through Vue Flow's internal API (applyNodeChanges/applyEdgeChanges)

      Flow: UI interaction -> Event -> Validation -> Apply via Vue Flow API -> UI updates

      This approach gives us full control over state management and enables:
      - Granular Undo/Redo with proper history tracking
      - Confirmation Dialogs that prevent changes before they're applied
      - Custom validation logic for changes

      Note: We use Vue Flow's internal applyNodeChanges/applyEdgeChanges methods.
      These are marked as deprecated but remain the working pattern until the 
      replacement "store instance" approach is properly documented.
      See: https://github.com/bcakmakoglu/vue-flow/discussions/1884

      Official Documentation: https://vueflow.dev/guide/controlled-flow.html
    -->
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :apply-default="false"
      :is-valid-connection="isValidConnection"
      :nodes-draggable="true"
      :pan-on-scroll="true"
      :delete-key-code="['Backspace', 'Delete']"
      fit-view-on-init
      class="vue-flow-instance w-full h-full"
    >
      <Background />
      
      <!-- Interactive minimap -->
      <!-- TODO: Configure it with nodeColor and nodeStrokeColor -->
      <MiniMap pannable zoomable />

      <!-- Vue Flow Basic Controls (zoom, fit, lock, etc.) -->
      <Controls position="bottom-left" />
    </VueFlow>

    <!-- Custom Application Toolbar -->
    <EditorToolbar />
    
    <!-- Modal Manager -->
    <ModalManager />
  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 