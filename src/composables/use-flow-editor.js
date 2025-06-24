import { useVueFlow, applyChanges } from "@vue-flow/core";
import { useFlowStore } from "@/stores/flow-store";
import { storeToRefs } from "pinia";
import { computed, nextTick } from "vue";
import { generateId } from "@/utils/id-generator";

/**
 * Composable for Vue Flow Editor Logic
 * 
 * This composable encapsulates all Vue Flow interactions and provides
 * a clean interface between components and the store. It follows Vue 3
 * composition patterns and makes the component more testable and reusable.
 * 
 * Benefits:
 * - Separates Vue Flow logic from component presentation
 * - Provides a consistent API for flow operations
 * - Makes components more testable (can mock this composable)
 * - Reduces coupling between Vue Flow and Pinia store
 * - Follows composition over inheritance principle
 */
export function useFlowEditor() {
  // --- Store Connection ---
  const flowStore = useFlowStore();
  const { nodes, edges, nodeBlocks, history, historyIndex } = storeToRefs(flowStore);

  // --- Computed Properties ---
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  // --- Vue Flow Hooks ---
  const vueFlowApi = useVueFlow();
  const {
    onConnect,
    onNodesChange,
    onEdgesChange,
    addNodes,
    addEdges,
    fitView,
    zoomIn,
    zoomOut,
    applyNodeChanges,
    applyEdgeChanges,
  } = vueFlowApi;

  /**
   * IMPORTANT: This function must be called exactly ONCE from the component that hosts the <VueFlow> element.
   * It sets up the global event handlers that connect Vue Flow's events to our store's actions.
   *
   * WHY THIS PATTERN IS NECESSARY:
   * The `useFlowEditor` composable is used by multiple components (the main editor, the toolbar, nodes, etc.).
   * If we registered these event listeners in the main body of the composable, each component instance would create
   * its own set of listeners, leading to duplicate events and corrupted state (e.g., adding multiple nodes/edges
   * for a single user action).
   *
   * By encapsulating the registration in a single function and calling it only from the top-level `flow-editor.vue`,
   * we guarantee that only one set of listeners exists for the entire application.
   */
  function initFlowEvents() {
    console.log('🔧 Initializing controlled flow events');
    
    onNodesChange((changes) => {
      console.log('📊 Node changes received:', changes);
      
      // Process each change and determine if we should apply it
      const validatedChanges = [];
      
      for (const change of changes) {
        console.log(`Processing change type: ${change.type}`, change);
        
        // For controlled flows, we validate changes and decide whether to apply them
        // This is where you'd add validation logic (confirm delete, etc.)
        validatedChanges.push(change);
      }
      
      console.log('✅ Applying validated changes through Vue Flow internal API:', validatedChanges);
      
      // CONTROLLED FLOW: Use Vue Flow's internal store method to apply changes
      // This updates both the internal state AND triggers UI updates
      // NOTE: applyNodeChanges is deprecated but still the working pattern until
      // the replacement "store instance" approach is properly documented
      // See: https://github.com/bcakmakoglu/vue-flow/discussions/1884
      applyNodeChanges(validatedChanges);
      
      // ALSO, update our external store to keep it in sync with the view
      nodes.value = applyChanges(validatedChanges, nodes.value);
      
      console.log('📝 Changes applied, store nodes:', nodes.value.length);
      
      // Notify the store to save history for significant changes
      flowStore.onNodesChange(validatedChanges);
    });

    onEdgesChange((changes) => {
      console.log('🔗 Edge changes received:', changes);
      
      // Process each change and determine if we should apply it
      const validatedChanges = [];
      
      for (const change of changes) {
        console.log(`Processing edge change type: ${change.type}`, change);
        
        // For controlled flows, we validate changes and decide whether to apply them
        validatedChanges.push(change);
      }
      
      console.log('✅ Applying validated edge changes through Vue Flow internal API:', validatedChanges);
      
      // CONTROLLED FLOW: Use Vue Flow's internal store method to apply changes
      // NOTE: applyEdgeChanges is deprecated but still the working pattern until
      // the replacement "store instance" approach is properly documented
      // See: https://github.com/bcakmakoglu/vue-flow/discussions/1884
      applyEdgeChanges(validatedChanges);
      
      // ALSO, update our external store to keep it in sync with the view
      edges.value = applyChanges(validatedChanges, edges.value);
      
      console.log('🔗 Edge changes applied, store edges:', edges.value.length);
      
      // Notify the store to save history
      flowStore.onEdgesChange(validatedChanges);
    });
    
    // We handle onConnect here in the controller to ensure the correct event is emitted.
    onConnect((connection) => {
      console.log('🔌 New connection:', connection);
      
      const newEdge = {
        ...connection,
        id: connection.id || generateId('edge'),
      };
      
      console.log('➕ Adding new edge:', newEdge);
      
      // Using the library's action ensures a *single*, clean `onEdgesChange` event is emitted.
      addEdges([newEdge]);
    });
  }

  /**
   * Restores the previous state from history.
   * It gets the state object from the store and uses imperative Vue Flow actions
   * to force the view to update to that state.
   */
  async function undo() {
    console.log('⏪ Undo requested');
    const stateToRestore = flowStore.undo();
    if (stateToRestore) {
      console.log('📖 Restoring state from history:', stateToRestore);
      
      // Set flag to prevent history saves during restoration
      flowStore.setRestoringHistory(true);
      
      // TODO: Revisit this implementation.
      // This is a workaround for a reactivity issue where Vue Flow doesn't
      // reliably update its view when the :nodes and :edges props are
      // programmatically replaced, especially when items are removed.
      // The "empty-then-set" pattern with nextTick forces a full re-render.
      nodes.value = [];
      edges.value = [];
      await nextTick();

      // Now, apply the actual restored state
      nodes.value = stateToRestore.nodes;
      edges.value = stateToRestore.edges;
      nodeBlocks.value = stateToRestore.nodeBlocks || {};
      
      flowStore.setRestoringHistory(false);
    } else {
      console.log('❌ No state to restore (at beginning of history)');
    }
  }

  /**
   * Restores the next state from history.
   * It gets the state object from the store and uses imperative Vue Flow actions
   * to force the view to update to that state.
   */
  async function redo() {
    console.log('⏩ Redo requested');
    const stateToRestore = flowStore.redo();
    if (stateToRestore) {
      console.log('📖 Restoring state from history:', stateToRestore);
      
      // Set flag to prevent history saves during restoration
      flowStore.setRestoringHistory(true);

      // TODO: Revisit this implementation.
      // This is a workaround for a reactivity issue where Vue Flow doesn't
      // reliably update its view when the :nodes and :edges props are
      // programmatically replaced, especially when items are removed.
      // The "empty-then-set" pattern with nextTick forces a full re-render.
      nodes.value = [];
      edges.value = [];
      await nextTick();
      
      // Now, apply the actual restored state
      nodes.value = stateToRestore.nodes;
      edges.value = stateToRestore.edges;
      nodeBlocks.value = stateToRestore.nodeBlocks || {};
      
      flowStore.setRestoringHistory(false);
    } else {
      console.log('❌ No state to restore (at end of history)');
    }
  }

  // --- Exposed API ---
  // This is what components will use - a clean, consistent interface
  return {
    // --- Reactive State ---
    nodes,
    edges,
    nodeBlocks,
    history,
    historyIndex,

    // --- Node Operations ---
    createNode: (nodeData) => {
      const newNode = {
        ...nodeData,
        id: generateId(),
      };

      // For nodes that can contain blocks, initialize their block list and set the hasBlocks flag
      if (nodeData.type === 'custom-setup' || nodeData.type === 'custom-lecture') {
        nodeBlocks.value[newNode.id] = [];
        newNode.data.hasBlocks = true;
      }

      // Use the Vue Flow action to add the node.
      // This will trigger the `onNodesChange` event with the correct 'add' type,
      // which our store will then use to save the history state.
      addNodes([newNode]);
    },
    addChildNode: (parentNodeId, childNodeData) => {
      // Find parent to calculate position, but this is a view concern.
      // The core logic is creating the node and adding it via the API.
      const parentNode = vueFlowApi.findNode(parentNodeId);
      if (!parentNode) {
        console.error(`Parent node with ID ${parentNodeId} not found.`);
        return;
      }

      // Find existing children for this parent to calculate the new position
      const existingChildren = nodes.value.filter(n => n.parentNode === parentNodeId);
      const newYPosition = (existingChildren.length * 60) + 50;

      const newChildNode = {
        id: generateId(childNodeData.type || 'node'),
        ...childNodeData,
        position: { x: 10, y: newYPosition }, // Position relative to parent
        parentNode: parentNodeId,
        extent: 'parent', // Constrain node to parent bounds
      };

      addNodes([newChildNode]);
    },

    // --- Edge Operations ---

    // --- Block Operations ---
    updateBlock: flowStore.updateBlock,
    addBlock: flowStore.addBlock,
    removeBlock: flowStore.removeBlock,
    reorderBlocks: flowStore.reorderBlocks,
    getNodeBlocks: flowStore.getNodeBlocks,
    getAssetFromSetup: flowStore.getAssetFromSetup,
    getAvailableAssets: flowStore.getAvailableAssets,

    // --- History Operations ---
    undo,
    redo,
    canUndo,
    canRedo,
    flushPendingSaves: flowStore.flushPendingSaves,

    // --- Viewport Operations ---
    fitToView: fitView,
    zoomIn,
    zoomOut,

    // --- Setup ---
    initFlowEvents,

    // --- Utility ---
    saveState: flowStore.saveState,
    clearHistory: flowStore.clearHistory,

    // --- Raw Vue Flow API (for advanced use cases) ---
    vueFlowApi,
  };
} 