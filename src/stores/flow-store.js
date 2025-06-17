import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applyChanges } from '@vue-flow/core'

/**
 * The store is the single source of truth for the flow editor's state.
 * It is responsible for holding the nodes, edges, and the history for undo/redo.
 * It follows the principles of a pure state container and has no knowledge of the VueFlow instance.
 */
export const useFlowStore = defineStore('flow', () => {
  // --- STATE ---
  const nodes = ref([
    { id: '1', type: 'input', label: 'Start', position: { x: 250, y: 5 } },
    { id: '2', label: 'A Node', position: { x: 100, y: 100 } },
    { id: '3', label: 'Another Node', position: { x: 400, y: 100 } },
    { id: '4', type: 'output', label: 'End', position: { x: 250, y: 200 } },
  ]);
  const edges = ref([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
  ]);

  const history = ref([])
  let historyIndex = -1

  // --- ACTIONS ---

  /**
   * Pushes the current state of nodes and edges to the history stack.
   * This is used for undo/redo functionality. It truncates any "future" states if a new state is saved after an undo.
   */
  function saveState() {
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    }
    // If we have undone actions, we clear the "future" history
    if (historyIndex < history.value.length - 1) {
      history.value.splice(historyIndex + 1)
    }
    history.value.push(currentState)
    historyIndex = history.value.length - 1
  }

  /**
   * Restores the previous state from the history stack.
   */
  function undo() {
    if (historyIndex > 0) {
      historyIndex--
      const previousState = history.value[historyIndex]
      nodes.value = JSON.parse(JSON.stringify(previousState.nodes))
      edges.value = JSON.parse(JSON.stringify(previousState.edges))
    }
  }

  /**
   * Restores the next state from the history stack.
   */
  function redo() {
    if (historyIndex < history.value.length - 1) {
      historyIndex++
      const nextState = history.value[historyIndex]
      nodes.value = JSON.parse(JSON.stringify(nextState.nodes))
      edges.value = JSON.parse(JSON.stringify(nextState.edges))
    }
  }
  
  // Save the initial state to the history
  saveState()

  return {
    nodes,
    edges,
    undo,
    redo,
    saveState,
    
    /**
     * Applies an array of node changes to the current nodes state.
     * This is called by the view component when it receives a `nodeschange` event.
     * @param {import('@vue-flow/core').NodeChange[]} changes
     */
    onNodesChange(changes) {
      nodes.value = applyChanges(changes, nodes.value)
      saveState()
    },
    
    /**
     * Applies an array of edge changes to the current edges state.
     * This is called by the view component when it receives an `edgeschange` event.
     * @param {import('@vue-flow/core').EdgeChange[]} changes
     */
    onEdgesChange(changes) {
      edges.value = applyChanges(changes, edges.value)
      saveState()
    },
    
    /**
     * Adds a new connection (edge) to the edges state.
     * This is called by the view component when it receives a `connect` event.
     * @param {import('@vue-flow/core').Connection} connection
     */
    onConnect(connection) {
      edges.value.push(connection)
      saveState()
    },
  }
}) 