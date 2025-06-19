import { useVueFlow } from "@vue-flow/core";
import { useFlowStore } from "@/stores/flow-store";
import { storeToRefs } from "pinia";
import { computed } from "vue";
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
    onNodeDragStop,
    addNodes,
    addEdges,
    removeNodes,
    removeEdges,
    updateNode,
    updateEdge,
    setNodes,
    setEdges,
    fitView,
    zoomIn,
    zoomOut,
    project,
    screenToFlowPosition,
  } = vueFlowApi;

  // --- Auto-wire Events to Store ---
  // This happens automatically when the composable is used
  onConnect(flowStore.onConnect);
  onNodesChange(flowStore.onNodesChange);
  onEdgesChange(flowStore.onEdgesChange);
  onNodeDragStop(flowStore.onNodeDragStop);

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
    deleteNode: (nodeId) => removeNodes(nodeId),
    updateNodeData: (nodeId, data) => updateNode(nodeId, { data }),
    addChildNode: flowStore.addChildNode,

    // --- Edge Operations ---
    deleteEdge: (edgeId) => removeEdges(edgeId),

    // --- Block Operations ---
    updateBlock: flowStore.updateBlock,
    addBlock: flowStore.addBlock,
    removeBlock: flowStore.removeBlock,
    reorderBlocks: flowStore.reorderBlocks,
    getNodeBlocks: flowStore.getNodeBlocks,
    getAssetFromSetup: flowStore.getAssetFromSetup,
    getAvailableAssets: flowStore.getAvailableAssets,

    // --- History Operations ---
    undo: flowStore.undo,
    redo: flowStore.redo,
    canUndo,
    canRedo,
    flushPendingSaves: flowStore.flushPendingSaves,

    // --- Viewport Operations ---
    fitToView: fitView,
    zoomIn,
    zoomOut,
    getFlowPosition: screenToFlowPosition,

    // --- Utility ---
    saveState: flowStore.saveState,
    clearHistory: flowStore.clearHistory,

    // --- Raw Vue Flow API (for advanced use cases) ---
    vueFlowApi,
  };
} 