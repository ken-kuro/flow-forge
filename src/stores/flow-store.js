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
  // Generate UUIDs for initial nodes (now using custom node types)
  const nodeId1 = generateId()
  const nodeId2 = generateId()
  
  const nodes = ref([
    { 
      id: nodeId1, 
      type: 'custom-start', 
      position: { x: 50, y: 150 },
      data: {
        title: 'Start',
        config: {}
      }
    },
    { 
      id: nodeId2, 
      type: 'custom-end', 
      position: { x: 2000, y: 150 },
      data: {
        title: 'End',
        config: {}
      }
    },
  ]);
  const edges = ref([]);

  // --- ENHANCED STATE FOR CUSTOM NODES ---
  // Blocks organized by node ID (Phase 2 architecture)
  const nodeBlocks = ref({})
  
  const history = ref([])
  const historyIndex = ref(-1)
  
  // --- CONCURRENCY CONTROL ---
  // Monotonically incrementing version for optimistic locking
  const version = ref(0)
  
  // --- ACTIONS ---
  // TODO: Revisit this architectural decision.
  // We are using `v-model` to bind the state to the VueFlow component.
  // This is convenient, but it also means that we are not able to intercept events before they are applied.
  // This is a problem if we want to implement features that require intercepting events before they are applied (e.g., "confirm on delete").
  // This would involve switching from `v-model` to a fully controlled flow by setting
  // `:apply-default="false"` on the <VueFlow> component and manually applying changes.
  // This is a big change and will require a lot of work, so we should revisit this decision.
  // Also, the action APIs will trigger changes events from VueFlow, so we will need to consider how to handle that.
  // BASICALLY, WE NEED TO COVER EVENTS, ACTIONS FROM USEVUEFLOW HOOK, AND ALSO THE HOOK LIKE USENODEDATA, CURRENTLY, WE ARE RELYING ON THE REACTIVE STATE.
  
  /**
   * Pushes the current state of nodes, edges, and nodeBlocks to the history stack.
   * This is used for undo/redo functionality. It truncates any "future" states if a new state is saved after an undo.
   *
   * PERFORMANCE NOTE: This function can be debounced (e.g., when called from `updateBlock`).
   * This prevents creating excessive history states during rapid-fire updates like typing in a text field.
   * As a result, operations that need to act on the *most current* state (like undo/redo)
   * must call `flushPendingSaves()` first to ensure no pending changes are missed.
   */
  function saveState() {
    // Increment version on every significant change
    version.value++
    
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      nodeBlocks: JSON.parse(JSON.stringify(nodeBlocks.value)),
      version: version.value
    }
    // If we have undone actions, we clear the "future" history
    if (historyIndex.value < history.value.length - 1) {
      history.value.splice(historyIndex.value + 1)
    }
    history.value.push(currentState)
    historyIndex.value = history.value.length - 1
  }



  /**
   * Forces any pending debounced saves (from `updateBlock`) to execute immediately.
   * This is crucial for preventing race conditions with the history stack.
   *
   * ### Scenario: Why This is Necessary
   *
   * 1.  **User Action**: The user types a character in a block's text field.
   * 2.  **Debounced Save**: `updateBlock()` is called, which schedules `saveState()` to run in 1000ms.
   * 3.  **Immediate Undo**: Before 1000ms passes, the user clicks "Undo".
   *
   * #### Without `flushPendingSaves()`:
   *   a. `undo()` executes, reverting to the state *before* the character was typed. The history index moves back.
   *   b. The 1000ms timer from step 2 is still pending.
   *   c. The timer fires. `saveState()` runs, capturing the state *with* the new character.
   *   d. This new state is pushed onto the history stack, effectively overwriting the "undone" state and corrupting the history, making a "redo" impossible.
   *
   * #### With `flushPendingSaves()`:
   *   a. `undo()` first calls this function.
   *   b. The pending `saveState()` timer is cancelled, and `saveState()` is called immediately. The history now correctly includes the typed character.
   *   c. `undo()` then proceeds, cleanly reverting to the state before the character was typed. The history is consistent.
   */
  function flushPendingSaves() {
    if (saveStateTimeout) {
      clearTimeout(saveStateTimeout)
      saveState()
      saveStateTimeout = null
    }
  }

  /**
   * Restores the previous state from the history stack.
   */
  function undo() {
    if (historyIndex.value > 0) {
      // Flush any pending saves before undoing
      flushPendingSaves()
      
      historyIndex.value--
      const previousState = history.value[historyIndex.value]

      // Directly assign state. Vue Flow's v-model will handle the update.
      nodes.value = JSON.parse(JSON.stringify(previousState.nodes))
      edges.value = JSON.parse(JSON.stringify(previousState.edges))
      
      // Restore nodeBlocks
      nodeBlocks.value = JSON.parse(JSON.stringify(previousState.nodeBlocks || {}))
      // Restore version
      version.value = previousState.version
    }
  }

  /**
   * Restores the next state from the history stack.
   */
  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      // Flush any pending saves before redoing
      flushPendingSaves()
      
      historyIndex.value++
      const nextState = history.value[historyIndex.value]
      
      // Directly assign state. Vue Flow's v-model will handle the update.
      nodes.value = JSON.parse(JSON.stringify(nextState.nodes))
      edges.value = JSON.parse(JSON.stringify(nextState.edges))
      
      // Restore nodeBlocks
      nodeBlocks.value = JSON.parse(JSON.stringify(nextState.nodeBlocks || {}))
      // Restore version
      version.value = nextState.version
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
    console.log('onNodesChange', changes)
    // Apply changes immediately for reactivity
    nodes.value = applyChanges(changes, nodes.value)
    
    // Only save state for add/remove changes - NOT position, dimensions, or selection
    // Position changes are handled by onNodeDragStop
    const hasSignificantChange = changes.some(change => 
      change.type === 'add' ||      // Node added (from toolbar, drag-drop, etc.)
      change.type === 'remove'      // Node deleted (Delete key, toolbar, etc.)
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
    const newEdge = {
      ...connection,
      id: connection.id || generateId(),
    }
    edges.value.push(newEdge)
    // onEdgesChange will be triggered by the view and will handle saving state
  }

  /**
   * Clear history and reset to current state only
   */
  function clearHistory() {
    // Flush any pending saves before clearing
    flushPendingSaves()
    
    // Save current state as the only history entry
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    }
    history.value = [currentState]
    historyIndex.value = 0
  }

  // --- BLOCK MANAGEMENT METHODS ---
  
  // Manual debounce for field updates to avoid excessive history entries
  let saveStateTimeout = null
  
  /**
   * Updates a specific block within a node (debounced save)
   * @param {string} nodeId - The ID of the node containing the block
   * @param {string} blockId - The ID of the block to update
   * @param {Object} newData - The new data to merge with the block
   * @param {boolean} immediate - Whether to save state immediately (default: false)
   */
  function updateBlock(nodeId, blockId, newData, immediate = false) {
    const blocks = nodeBlocks.value[nodeId]
    if (blocks) {
      const blockIndex = blocks.findIndex(b => b.id === blockId)
      if (blockIndex !== -1) {
        // Perform the update
        blocks[blockIndex].data = { ...blocks[blockIndex].data, ...newData }
        
        // Save state, either immediately or debounced
        if (immediate) {
          // Clear any pending debounced save and save immediately
          if (saveStateTimeout) {
            clearTimeout(saveStateTimeout)
            saveStateTimeout = null
          }
          saveState()
        } else {
          // Debounced save - wait 1 second after last change
          if (saveStateTimeout) {
            clearTimeout(saveStateTimeout)
          }
          saveStateTimeout = setTimeout(() => {
            saveState()
            saveStateTimeout = null
          }, 750) // Using 750ms delay
        }
      }
    }
  }

  /**
   * Adds a new block to a node
   * @param {string} nodeId - The ID of the node to add the block to
   * @param {Object} blockData - The block data to add
   */
  function addBlock(nodeId, blockData) {
    if (!nodeBlocks.value[nodeId]) {
      nodeBlocks.value[nodeId] = []
    }
    nodeBlocks.value[nodeId].push({
      id: generateId(),
      ...blockData
    })
    saveState()
  }

  /**
   * Removes a block from a node
   * @param {string} nodeId - The ID of the node containing the block
   * @param {string} blockId - The ID of the block to remove
   */
  function removeBlock(nodeId, blockId) {
    if (nodeBlocks.value[nodeId]) {
      nodeBlocks.value[nodeId] = nodeBlocks.value[nodeId].filter(b => b.id !== blockId)
      saveState()
    }
  }

  /**
   * Reorders blocks within a node
   * @param {string} nodeId - The ID of the node containing the blocks
   * @param {number} fromIndex - The current index of the block
   * @param {number} toIndex - The target index for the block
   */
  function reorderBlocks(nodeId, fromIndex, toIndex) {
    const blocks = nodeBlocks.value[nodeId]
    if (blocks && fromIndex !== toIndex) {
      const [removed] = blocks.splice(fromIndex, 1)
      blocks.splice(toIndex, 0, removed)
      saveState()
    }
  }

  /**
   * Gets all blocks for a specific node
   * @param {string} nodeId - The ID of the node
   * @returns {Array} Array of blocks for the node
   */
  function getNodeBlocks(nodeId) {
    return nodeBlocks.value[nodeId] || []
  }

  /**
   * Resolves an asset reference from a setup node
   * @param {string} setupNodeId - The ID of the setup node
   * @param {string} assetId - The ID of the asset
   * @returns {Object|null} The asset block data or null if not found
   */
  function getAssetFromSetup(setupNodeId, assetId) {
    const setupBlocks = nodeBlocks.value[setupNodeId] || []
    return setupBlocks.find(block => 
      (block.type === 'asset-image' || block.type === 'asset-video') && 
      block.data.assetId === assetId
    ) || null
  }

  /**
   * Gets all available assets from setup nodes
   * @returns {Array} Array of available assets with metadata
   */
  function getAvailableAssets() {
    const assets = []
    
    // Find all setup nodes
    const setupNodes = nodes.value.filter(n => n.type === 'custom-setup')
    
    setupNodes.forEach(setupNode => {
      const setupBlocks = nodeBlocks.value[setupNode.id] || []
      setupBlocks.forEach(block => {
        if (block.type === 'asset-image' || block.type === 'asset-video') {
          assets.push({
            setupNodeId: setupNode.id,
            setupNodeTitle: setupNode.data.title,
            assetId: block.data.assetId,
            assetTitle: block.data.title,
            assetType: block.type,
            assetData: block.data
          })
        }
      })
    })
    
    return assets
  }

  /**
   * Creates a new child node and attaches it to a parent node.
   * This is used for creating condition branches, etc.
   * @param {string} parentNodeId The ID of the parent node.
   * @param {object} childNodeData The configuration for the new child node (type, data, etc.).
   */
  function addChildNode(parentNodeId, childNodeData) {
    if (!nodes.value) return;

    const parentNode = nodes.value.find(n => n.id === parentNodeId);
    if (!parentNode) {
      console.error(`Parent node with ID ${parentNodeId} not found.`);
      return;
    }

    // Find existing children for this parent to calculate the new position
    const existingChildren = nodes.value.filter(n => n.parentNode === parentNodeId);

    // Simple vertical stacking for now
    const newYPosition = (existingChildren.length * 60) + 50; // 60px height per child + padding

    const newChildNode = {
      id: generateId(childNodeData.type || 'node'),
      ...childNodeData,
      position: { x: 10, y: newYPosition }, // Position relative to parent
      parentNode: parentNodeId,
      // extent: 'parent', // Constrain node to parent bounds
    };

    nodes.value.push(newChildNode);
    saveState();
  }

  // Save the initial state to the history
  saveState()

  return {
    // --- STATE ---
    nodes,
    edges,
    nodeBlocks,
    version,
    history,
    historyIndex,
    
    // --- HISTORY ACTIONS ---
    undo,
    redo,
    saveState,
    clearHistory,
    flushPendingSaves,
    
    // --- VUE FLOW EVENT HANDLERS ---
    onNodesChange,
    onNodeDragStop,
    onEdgesChange,
    onConnect,
    
    // --- NODE/EDGE OPERATIONS ---
    
    // --- BLOCK MANAGEMENT METHODS ---
    updateBlock,
    addBlock,
    removeBlock,
    reorderBlocks,
    getNodeBlocks,
    getAssetFromSetup,
    getAvailableAssets,
    
    // --- INTERNAL METHODS ---
    addChildNode,
  }
}) 