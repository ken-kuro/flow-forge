import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateId } from '@/utils/id-generator'
import { NODE_TYPES } from '@/utils/constants'



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
      type: NODE_TYPES.START, 
      position: { x: 50, y: 150 },
      data: {
        title: 'Start',
        config: {}
      }
    },
    { 
      id: nodeId2, 
      type: NODE_TYPES.END, 
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
  
  // Flag to prevent history saves during undo/redo operations
  const isRestoringHistory = ref(false)
  
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
   * Moves the history index back and returns the state to restore.
   * This function DOES NOT apply the state itself. The controller is responsible
   * for calling this and then using the Vue Flow API to apply the returned state.
   * @returns {object|null} The state object to restore, or null if no history.
   */
  function undo() {
    if (historyIndex.value <= 0) return null;

    flushPendingSaves();
    historyIndex.value--;
    const previousState = history.value[historyIndex.value];
    return JSON.parse(JSON.stringify(previousState));
  }

  /**
   * Moves the history index forward and returns the state to restore.
   * This function DOES NOT apply the state itself. The controller is responsible
   * for calling this and then using the Vue Flow API to apply the returned state.
   * @returns {object|null} The state object to restore, or null if no history.
   */
  function redo() {
    if (historyIndex.value >= history.value.length - 1) return null;

    flushPendingSaves();
    historyIndex.value++;
    const nextState = history.value[historyIndex.value];
    return JSON.parse(JSON.stringify(nextState));
  }
  
  /**
   * This handler is now only responsible for history management.
   * The actual application of changes is handled by the `useFlowEditor` controller,
   * which will apply changes to the state *before* calling this handler.
   * @param {import('@vue-flow/core').NodeChange[]} changes
   */
  function onNodesChange(changes) {
    console.log('🏪 Store: onNodesChange called', { changes, isRestoring: isRestoringHistory.value });
    
    // Don't save history during undo/redo operations
    if (isRestoringHistory.value) {
      console.log('⏳ Skipping history save during restoration');
      return;
    }
    
    // We only save history for significant, atomic actions.
    const hasSignificantChange = changes.some(change => {
      if (change.type === 'add' || change.type === 'remove') {
        return true;
      }
      // Position changes with dragging: false indicate end of drag operation
      if (change.type === 'position' && change.dragging === false) {
        return true;
      }
      return false;
    });

    console.log('📊 Has significant change:', hasSignificantChange);

    if (hasSignificantChange) {
      // For position changes, we only want one history entry per drag operation
      const hasPositionChange = changes.some(change => 
        change.type === 'position' && change.dragging === false
      );
      
      if (hasPositionChange) {
        console.log('💾 Saving state for position change');
        // Save once for the entire drag operation
        saveState();
      } else {
        // For add/remove, save for each significant change
        changes.forEach(change => {
          if (change.type === 'add' || change.type === 'remove') {
            console.log(`💾 Saving state for ${change.type} change`);
            saveState();
          }
        });
      }
    }
  }
  
  /**
   * This handler is now only responsible for history management.
   * The actual application of changes is handled by the `useFlowEditor` controller,
   * which will apply changes to the state *before* calling this handler.
   * @param {import('@vue-flow/core').EdgeChange[]} changes
   */
  function onEdgesChange(changes) {
    console.log('🏪 Store: onEdgesChange called', { changes, isRestoring: isRestoringHistory.value });
    
    // Don't save history during undo/redo operations
    if (isRestoringHistory.value) {
      console.log('⏳ Skipping edge history save during restoration');
      return;
    }
    
    // We only save history for significant, atomic actions.
    const hasSignificantChange = changes.some(change =>
      change.type === 'add' || change.type === 'remove'
    );

    console.log('🔗 Has significant edge change:', hasSignificantChange);

    if (hasSignificantChange) {
      // Since batched changes can have multiple 'add' events, we save for each one.
      changes.forEach(change => {
        if (change.type === 'add' || change.type === 'remove') {
          console.log(`💾 Saving state for edge ${change.type} change`);
          saveState();
        }
      });
    }
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
    const setupNodes = nodes.value.filter(n => n.type === NODE_TYPES.SETUP)
    
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
   * Sets the flag to prevent history saves during undo/redo operations
   * @param {boolean} value - Whether we are currently restoring history
   */
  function setRestoringHistory(value) {
    isRestoringHistory.value = value;
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
    setRestoringHistory,
    
    // --- VUE FLOW EVENT HANDLERS (for history) ---
    onNodesChange,
    onEdgesChange,
    
    // --- BLOCK MANAGEMENT METHODS ---
    updateBlock,
    addBlock,
    removeBlock,
    reorderBlocks,
    getNodeBlocks,
    getAssetFromSetup,
    getAvailableAssets,
  }
}) 