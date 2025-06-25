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
   * Formats an internal node type string into a human-readable name.
   * e.g., 'custom-setup' -> 'Setup Node'
   * @param {string} type - The internal node type.
   * @returns {string} The formatted name.
   */
  const formatNodeTypeName = (type) => {
    if (!type) return 'Node';
    const formatted = type
      .replace('custom-', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return formatted + ' Node';
  };
  
  /**
   * Pushes the current state of nodes, edges, and nodeBlocks to the history stack.
   * This is used for undo/redo functionality. It truncates any "future" states if a new state is saved after an undo.
   *
   * PERFORMANCE NOTE: This function can be debounced (e.g., when called from `updateBlock`).
   * This prevents creating excessive history states during rapid-fire updates like typing in a text field.
   * As a result, operations that need to act on the *most current* state (like undo/redo)
   * must call `flushPendingSaves()` first to ensure no pending changes are missed.
   */
  function saveState(description = 'Unknown action') {
    // Increment version on every significant change
    version.value++
    
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      nodeBlocks: JSON.parse(JSON.stringify(nodeBlocks.value)),
      version: version.value,
      description: description,
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
      // BATCHING STRATEGY: Changes that happen together should be grouped as one history entry
      // This occurs in: library auto-handling, multi-select operations, programmatic changes
      
      // For position changes, we only want one history entry per drag operation
      const hasPositionChange = changes.some(change => 
        change.type === 'position' && change.dragging === false
      );
      
      if (hasPositionChange) {
        const node = nodes.value.find(n => n.id === changes.find(c => c.type === 'position').id);
        const description = `Move ${formatNodeTypeName(node?.type)} "${node?.data?.title || node?.id}"`;
        console.log(`💾 Saving state for position change: ${description}`);
        saveState(description);
      } else {
        // Group changes by type for batching
        const addChanges = changes.filter(c => c.type === 'add');
        const removeChanges = changes.filter(c => c.type === 'remove');
        
        // Handle node additions
        if (addChanges.length > 0) {
          if (addChanges.length === 1) {
            const node = addChanges[0].item;
            const description = `Add ${formatNodeTypeName(node.type)} "${node?.data?.title || ''}"`;
            console.log(`💾 Saving state for single node addition: ${description}`);
            saveState(description);
          } else {
            // Multiple nodes added at once (e.g., import, paste)
            const nodeTypes = addChanges.map(c => formatNodeTypeName(c.item.type));
            const uniqueTypes = [...new Set(nodeTypes)];
            const description = addChanges.length === uniqueTypes.length && uniqueTypes.length === 1 
              ? `Add ${addChanges.length} ${uniqueTypes[0]} nodes`
              : `Add ${addChanges.length} nodes`;
            console.log(`💾 Saving state for batch node addition: ${description}`);
            saveState(description);
          }
        }
        
        // Handle node removals
        if (removeChanges.length > 0) {
          if (removeChanges.length === 1) {
            const description = `Remove node`;
            console.log(`💾 Saving state for single node removal: ${description}`);
            saveState(description);
          } else {
            // Multiple nodes removed at once (e.g., multi-select delete)
            const description = `Remove ${removeChanges.length} nodes`;
            console.log(`💾 Saving state for batch node removal: ${description}`);
            saveState(description);
          }
        }
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
      // BATCHING STRATEGY: Changes that happen together should be grouped as one history entry
      // This occurs in: library auto-handling, multi-select operations, programmatic changes
      
      // Group changes by type for batching
      const addChanges = changes.filter(c => c.type === 'add');
      const removeChanges = changes.filter(c => c.type === 'remove');
      
      // Handle edge additions individually (each connection is a separate user action)
      for (const change of addChanges) {
        const edge = change.item;
        const sourceNode = nodes.value.find(n => n.id === edge.source);
        const targetNode = nodes.value.find(n => n.id === edge.target);
        const description = `Connect ${formatNodeTypeName(sourceNode?.type)} "${sourceNode?.data?.title || edge.source}" to ${formatNodeTypeName(targetNode?.type)} "${targetNode?.data?.title || edge.target}"`;
        console.log(`💾 Saving state for edge ${change.type} change: ${description}`);
        saveState(description);
      }
      
      // Handle edge removals as a batch (likely from node deletion)
      if (removeChanges.length > 0) {
        if (removeChanges.length === 1) {
          // Single edge removal - likely user manually disconnected
          const description = `Disconnect edge`;
          console.log(`💾 Saving state for single edge removal: ${description}`);
          saveState(description);
        } else {
          // Multiple edge removals - likely from node deletion, batch them
          const description = `Disconnect ${removeChanges.length} edges`;
          console.log(`💾 Saving state for batch edge removal: ${description}`);
          saveState(description);
        }
      }
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
  const DEBOUNCE_DELAY = 750 // Universal debounce delay in milliseconds
  
  /**
   * Updates a specific block within a node's data.
   * This is called from the block components themselves.
   * @param {string} nodeId - The ID of the node containing the block.
   * @param {string} blockId - The ID of the block to update.
   * @param {object} newData - The new data to merge into the block.
   * @param {boolean} [immediate=false] - If true, saves history immediately. Otherwise, debounces the save.
   */
  function updateBlock(nodeId, blockId, newData, immediate = false) {
    // Prevent any updates or history saves during an active undo/redo
    if (isRestoringHistory.value) {
      console.log('⏳ Skipping block update during restoration');
      return;
    }

    const node = nodes.value.find(n => n.id === nodeId)
    if (node) {
      const blocks = nodeBlocks.value[nodeId]
      if (blocks) {
        const blockIndex = blocks.findIndex(b => b.id === blockId)
        if (blockIndex !== -1) {
          const block = blocks[blockIndex];
          const oldTitle = block.data.title;
          
          let description;
          const blockName = block.data.title || `Block #${block.id.slice(0,4)}`;
          const nodeIdentifier = `${formatNodeTypeName(node?.type)} "${node?.data.title}"`;

          // Simple, consistent approach: only handle title renames specially
          if (newData.title && newData.title !== oldTitle) {
            description = `Rename block from "${oldTitle}" to "${newData.title}" in ${nodeIdentifier}`;
          } else {
            // Generic message for all other updates
            description = `Update block "${blockName}" in ${nodeIdentifier}`;
          }

          // Perform the update
          blocks[blockIndex].data = { ...blocks[blockIndex].data, ...newData }
          
          // Save state, either immediately or debounced
          if (immediate) {
            // Clear any pending debounced save and save immediately
            if (saveStateTimeout) {
              clearTimeout(saveStateTimeout)
              saveStateTimeout = null
            }
            saveState(description);
          } else {
            // Debounced save - wait 1 second after last change
            if (saveStateTimeout) {
              clearTimeout(saveStateTimeout)
            }
            saveStateTimeout = setTimeout(() => {
              saveState(description);
              saveStateTimeout = null
            }, 750) // Using 750ms delay
          }
        }
      }
    }
  }

  /**
   * Updates the data payload of a specific node.
   * 
   * ARCHITECTURAL NOTE:
   * We use an explicit store action here instead of a hypothetical library function
   * like `vueFlow.updateNodeData()` for a critical reason: **explicit state control and history.**
   * 
   * A library's UI command would trigger a generic `onNodesChange` event (e.g., a 'dimensions'
   * change), from which we could not reliably determine the user's specific intent.
   * 
   * By using our own action, we know exactly *what* changed (e.g., the title) and *why*.
   * This allows us to create precise, descriptive history entries (e.g., "Rename node from 'X' to 'Y'")
   * and maintain a clean, predictable state management pattern.
   * 
   * @param {string} nodeId - The ID of the node to update.
   * @param {object} newData - The new data to merge into the node's data object.
   */
  function updateNodeData(nodeId, newData) {
    const node = nodes.value.find(n => n.id === nodeId);
    if (node) {
      const oldTitle = node.data.title;
      node.data = { ...node.data, ...newData };
      const newTitle = node.data.title;

      let description = `Update ${formatNodeTypeName(node.type)} "${oldTitle || node.id}"`;
      if (newData.title && newData.title !== oldTitle) {
        description = `Rename ${formatNodeTypeName(node.type)} from "${oldTitle}" to "${newTitle}"`;
      }
      saveState(description); 
    }
  }

  /**
   * Adds a new block to a node
   * @param {string} nodeId - The ID of the node to add the block to.
   * @param {object} blockData - The data for the new block (type, etc.).
   */
  function addBlock(nodeId, blockData) {
    if (!nodeBlocks.value[nodeId]) {
      nodeBlocks.value[nodeId] = [];
    }

    // Find the node for the description
    const node = nodes.value.find(n => n.id === nodeId);

    // Generate a default title for the block
    const existingBlocks = nodeBlocks.value[nodeId];
    const count = existingBlocks.filter(b => b.type === blockData.type).length + 1;
    const typeName = blockData.type.replace('asset-', '').replace('-', ' ');
    const defaultTitle = `${typeName.charAt(0).toUpperCase() + typeName.slice(1)} #${count}`;

    const newBlock = {
      id: generateId('block'),
      ...blockData,
      data: {
        ...blockData.data,
        title: defaultTitle,
      },
    };

    nodeBlocks.value[nodeId].push(newBlock);
    const description = `Add block "${defaultTitle}" to ${formatNodeTypeName(node?.type)} "${node?.data?.title}"`;
    saveState(description);
  }

  /**
   * Removes a block from a node
   * @param {string} nodeId - The ID of the node containing the block
   * @param {string} blockId - The ID of the block to remove
   */
  function removeBlock(nodeId, blockId) {
    if (nodeBlocks.value[nodeId]) {
      const block = nodeBlocks.value[nodeId].find(b => b.id === blockId);
      nodeBlocks.value[nodeId] = nodeBlocks.value[nodeId].filter(b => b.id !== blockId);
      
      // If this was a condition branch block, remove associated edges
      if (block && block.type === 'condition-branch') {
        removeEdgesForBranch(nodeId, blockId);
      }
      
      saveState();
    }
  }

  /**
   * Removes all edges connected to a specific condition branch
   * @param {string} nodeId - The ID of the condition node
   * @param {string} branchId - The ID of the branch block
   */
  function removeEdgesForBranch(nodeId, branchId) {
    console.log('🔍 Looking for edges to remove for branch:', branchId, 'on node:', nodeId);
    console.log('🔍 Current edges:', edges.value);
    
    const edgesToRemove = edges.value.filter(edge => {
      console.log('🔍 Checking edge:', edge);
      console.log('🔍 Edge data:', edge.data);
      const matches = edge.data?.branchId === branchId && 
        edge.source === nodeId &&
        edge.data?.isConditionBranch === true;
      console.log('🔍 Edge matches criteria:', matches);
      return matches;
    });
    
    console.log('🔍 Edges to remove:', edgesToRemove);
    
    if (edgesToRemove.length > 0) {
      console.log(`🗑️ Removing ${edgesToRemove.length} edges for deleted branch ${branchId}`);
      edges.value = edges.value.filter(edge => 
        !(edge.data?.branchId === branchId && edge.source === nodeId)
      );
      console.log('🔍 Remaining edges after removal:', edges.value);
    } else {
      console.log('❌ No edges found to remove for branch:', branchId);
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
    
    for (const setupNode of setupNodes) {
      const setupBlocks = nodeBlocks.value[setupNode.id] || []
      for (const block of setupBlocks) {
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
      }
    }
    
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
  saveState('Initialize Flow with Start and End nodes')

  /**
   * Gets all edges connected to a specific condition branch
   * @param {string} nodeId - The ID of the condition node
   * @param {string} branchId - The ID of the branch block
   * @returns {Array} Array of edges connected to this branch
   */
  function getEdgesForBranch(nodeId, branchId) {
    return edges.value.filter(edge => 
      edge.data?.branchId === branchId && 
      edge.source === nodeId &&
      edge.data?.isConditionBranch === true
    );
  }

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
    updateNodeData,
    
    // --- Asset Management ---
    getAssetFromSetup,
    getAvailableAssets,
    
    // --- Condition Branch Edge Management ---
    removeEdgesForBranch,
    getEdgesForBranch,
  }
}) 