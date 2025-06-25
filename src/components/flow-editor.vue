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
 * 
 * TODO: EDGE_VALIDATION - Implement proper edge validation and duplicate prevention
 * Current issues to address:
 * 1. Prevent duplicate edges between the same source/target nodes
 * 2. Vue Flow doesn't natively support visual separation of parallel edges
 * 3. Consider implementing custom edge routing or path offsetting
 * 4. Add user confirmation dialog for potential duplicate connections
 * 5. Implement edge labeling/numbering for better identification
 * 
 * Possible solutions:
 * - Custom edge component with bezier curve offsets
 * - Validation to prevent duplicates entirely
 * - Edge bundling/grouping UI for multiple connections
 * - Custom pathfinding algorithm for parallel edge routing
 * 
 * @param {Object} connection - The connection being validated
 * @returns {boolean} - Whether the connection is valid
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
    <!-- TODO: CUSTOM_MARKERS - Implement custom edge markers for better visual design
         Current requirements:
         1. Circle markers at start of edges, arrow markers at end
         2. Custom marker definitions with proper SVG paths
         3. State management for hover/selected marker colors
         4. Bottom-right corner positioning for card node output handles
         5. Increased padding (top/bottom) for card nodes to match design
         6. Handle marker state changes dynamically
         
         Reference: https://vueflow.dev/examples/edges/markers.html
         
         This is a UI polish feature for future phases, not Phase 3 priority.
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
      :multi-selection-key-code="['Control']"
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