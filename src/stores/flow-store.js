import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applyChanges } from '@vue-flow/core'
import { generateId } from '@/utils/id-generator'



/**
 * The store is the single source of truth for the flow editor's state.
 * It is responsible for holding the nodes, edges, and the history for undo/redo.
 * It follows the principles of a pure state container and has no knowledge of the VueFlow instance.
 */
export const useFlowStore = defineStore('flow', () => {
  // --- STATE ---
  // Generate UUIDs for initial nodes
  const nodeId1 = generateId()
  const nodeId2 = generateId()
  const nodeId3 = generateId()
  const nodeId4 = generateId()
  
  const nodes = ref([
    { id: nodeId1, type: 'input', label: 'Start', position: { x: 250, y: 5 } },
    { id: nodeId2, label: 'A Node', position: { x: 100, y: 100 } },
    { id: nodeId3, label: 'Another Node', position: { x: 400, y: 100 } },
    { id: nodeId4, type: 'output', label: 'End', position: { x: 250, y: 200 } },
  ]);
  const edges = ref([
    { id: generateId(), source: nodeId1, target: nodeId2, animated: true },
    { id: generateId(), source: nodeId1, target: nodeId3 },
  ]);

  const history = ref([])
  const historyIndex = ref(-1)
  
  // Vue Flow actions (injected from the component)
  let vueFlowActions = null

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
    if (historyIndex.value < history.value.length - 1) {
      history.value.splice(historyIndex.value + 1)
    }
    history.value.push(currentState)
    historyIndex.value = history.value.length - 1
  }



  /**
   * Restores the previous state from the history stack.
   */
  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      const previousState = history.value[historyIndex.value]
      
      // Use Vue Flow actions if available, otherwise fall back to direct assignment
      if (vueFlowActions) {
        // Use setNodes/setEdges to replace the entire state
        vueFlowActions.setNodes(previousState.nodes)
        vueFlowActions.setEdges(previousState.edges)
      } else {
        // Fallback to direct assignment
        nodes.value = JSON.parse(JSON.stringify(previousState.nodes))
        edges.value = JSON.parse(JSON.stringify(previousState.edges))
      }
    }
  }

  /**
   * Restores the next state from the history stack.
   */
  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const nextState = history.value[historyIndex.value]
      
      // Use Vue Flow actions if available, otherwise fall back to direct assignment
      if (vueFlowActions) {
        // Use setNodes/setEdges to replace the entire state
        vueFlowActions.setNodes(nextState.nodes)
        vueFlowActions.setEdges(nextState.edges)
      } else {
        // Fallback to direct assignment
        nodes.value = JSON.parse(JSON.stringify(nextState.nodes))
        edges.value = JSON.parse(JSON.stringify(nextState.edges))
      }
    }
  }
  
  /**
   * Applies an array of node changes to the current nodes state.
   * This is called by the view component when it receives a `nodeschange` event.
   * 
   * WHY WE USE THIS GENERIC EVENT:
   * - Vue Flow batches multiple change types into a single event for performance
   * - Handles: add, remove, reset, select, dimensions, position changes
   * - We filter to only save state for significant changes (add/remove/reset)
   * - Position changes are deliberately ignored here (handled by onNodeDragStop)
   * 
   * ALTERNATIVE: We could use more specific events like:
   * - onNodeAdd, onNodeRemove (don't exist in Vue Flow)
   * - Template events (@nodes-change in template, but less performant)
   * 
        * EXAMPLE CHANGES RECEIVED:
     * - Add node: [{ type: 'add', item: {...node} }]
     * - Delete node: [{ type: 'remove', id: 'node-1' }]
     * - Move node: [{ type: 'position', id: 'node-1', position: {x: 100, y: 200}, dragging: true }]
     * - Select node: [{ type: 'select', id: 'node-1', selected: true }]
     * - Resize node: [{ type: 'dimensions', id: 'node-1', dimensions: {width: 200, height: 100} }]
   * 
   * @param {import('@vue-flow/core').NodeChange[]} changes
   */
  function onNodesChange(changes) {
    // Apply changes immediately for reactivity
    nodes.value = applyChanges(changes, nodes.value)
    
    // Only save state for add/remove changes - NOT position, dimensions, or selection
    // Position changes are handled by onNodeDragStop
    const hasSignificantChange = changes.some(change => 
      change.type === 'add' ||      // Node added (from toolbar, drag-drop, etc.)
      change.type === 'remove'      // Node deleted (Delete key, toolbar, etc.)
      // NOTE: 'reset' type doesn't exist in Vue Flow API
      // Bulk operations (undo/redo) use setNodes() which doesn't trigger onNodesChange
    )
    
    if (hasSignificantChange) {
      saveState()
    }
  }
  
  /**
   * Called when a node drag operation stops.
   * 
   * WHY WE USE THIS SPECIFIC EVENT:
   * - Provides the exact moment when dragging ends
   * - Prevents creating history entries during drag (performance)
   * - More reliable than detecting dragging: false in onNodesChange
   * - Vue Flow guarantees this fires once per drag operation
   * 
   * ALTERNATIVE: We could detect position changes in onNodesChange, but:
   * - Would create many history entries during drag
   * - Less reliable drag detection
   * - Worse performance
   * 
   * COMPARISON:
   * ❌ Using position in onNodesChange:
   *    - Drag node 100px → 100+ history entries (one per pixel)
   *    - Press Undo → goes back 1 pixel at a time
   *    - Memory usage: 100+ deep clones of entire state
   * 
   * ✅ Using onNodeDragStop:
   *    - Drag node 100px → 1 history entry
   *    - Press Undo → goes back to start position
   *    - Memory usage: 1 deep clone of state
   */
  function onNodeDragStop() {
    saveState()
  }
  
  /**
   * Applies an array of edge changes to the current edges state.
   * This is called by the view component when it receives an `edgeschange` event.
   * 
   * WHY WE USE THIS GENERIC EVENT:
   * - Similar to onNodesChange, batches multiple change types
   * - Handles: add, remove, select, update changes
   * - We filter to only save state for add/remove (not selection)
   * 
   * ALTERNATIVE: We could use:
   * - onEdgeAdd, onEdgeRemove (don't exist in Vue Flow)
   * - Handle in onConnect only (but misses deletions)
   * 
   * @param {import('@vue-flow/core').EdgeChange[]} changes
   */
  function onEdgesChange(changes) {
    // Apply changes immediately for reactivity
    edges.value = applyChanges(changes, edges.value)
    
    // Save state only for significant changes (add/remove, not selection)
    const hasSignificantChange = changes.some(change => 
      change.type === 'add' ||      // Edge added (usually from onConnect)
      change.type === 'remove'      // Edge deleted (Delete key, disconnect)
    )
    
    if (hasSignificantChange) {
      saveState()
    }
  }
  
  /**
   * Adds a new connection (edge) to the edges state.
   * This is called by the view component when it receives a `connect` event.
   * 
   * WHY WE USE THIS SPECIFIC EVENT:
   * - Fires exactly when user creates a connection by dragging
   * - Provides the connection object with source/target info
   * - Allows us to add custom logic (ID generation, validation)
   * - More semantic than detecting 'add' changes in onEdgesChange
   * 
   * NOTE: This triggers onEdgesChange automatically when we call addEdges()
   * 
   * @param {import('@vue-flow/core').Connection} connection
   */
  function onConnect(connection) {
    // Generate a UUID for the new edge
    const edge = {
      ...connection,
      id: connection.id || generateId(),
    }
    
    // Use Vue Flow actions if available, otherwise fall back to direct manipulation
    if (vueFlowActions) {
      // Vue Flow actions will trigger onEdgesChange which will call saveState()
      vueFlowActions.addEdges(edge)
    } else {
      // Direct manipulation needs manual state saving
      edges.value.push(edge)
      saveState()
    }
  }

  /**
   * Creates a new node with a UUID and adds it to the nodes state.
   * @param {Object} nodeData - The node data (type, label, position, etc.)
   * @returns {string} The generated UUID for the new node
   */
  function createNode(nodeData) {
    const nodeId = generateId()
    const newNode = {
      id: nodeId,
      ...nodeData,
    }
    
    // Use Vue Flow actions if available, otherwise fall back to direct manipulation
    if (vueFlowActions) {
      // Vue Flow actions will trigger onNodesChange which will call saveState()
      vueFlowActions.addNodes(newNode)
    } else {
      // Direct manipulation needs manual state saving
      nodes.value.push(newNode)
      saveState()
    }
    
    return nodeId
  }

  /**
   * Set Vue Flow actions from the component
   * @param {Object} actions - Vue Flow actions object
   */
  function setVueFlowActions(actions) {
    vueFlowActions = actions
  }

  /**
   * Clear history and reset to current state only
   */
  function clearHistory() {
    // Save current state as the only history entry
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    }
    history.value = [currentState]
    historyIndex.value = 0
  }

  // Save the initial state to the history
  saveState()

  return {
    // --- STATE ---
    nodes,
    edges,
    history,
    historyIndex,
    
    // --- HISTORY ACTIONS ---
    undo,
    redo,
    saveState,
    clearHistory,
    
    // --- VUE FLOW EVENT HANDLERS ---
    onNodesChange,
    onNodeDragStop,
    onEdgesChange,
    onConnect,
    
    // --- NODE/EDGE OPERATIONS ---
    createNode,
    
    // --- INTERNAL METHODS ---
    setVueFlowActions,
  }
}) 