import { useVueFlow } from '@vue-flow/core'
import { useFlowStore } from '@/stores/flow-store'
import { storeToRefs } from 'pinia'
import { computed, nextTick } from 'vue'
import { generateId } from '@/utils/id-generator'
import { NODE_TYPES } from '@/utils/constants'

/**
 * Composable for Vue Flow Editor Logic
 *
 * TODO: REPO_QUALITY - Set up project-wide tooling for code quality and consistency.
 * - ESLint: For identifying and reporting on patterns in JavaScript.
 * - Prettier: For enforcing a consistent code style.
 * - Husky: For running scripts (like linting) on pre-commit hooks.
 * - Vitest: For setting up a unit and component testing framework.
 *
 * TODO: PRODUCTION - Configure build process to strip all console.log statements
 * for production builds to avoid leaking debug information.
 *
 * This composable encapsulates all Vue Flow interactions and provides
 * a clean interface between components and the store. It uses a controlled
 * flow pattern with :apply-default="false" and v-model for optimal state sync.
 *
 * Benefits:
 * - Separates Vue Flow logic from component presentation
 * - Full control over change validation with :apply-default="false"
 * - Automatic state synchronization via v-model binding
 * - Eliminates double-application bugs through single source of truth
 * - Makes components more testable (can mock this composable)
 * - Reduces coupling between Vue Flow and Pinia store
 */
export function useFlowEditor() {
    // --- Store Connection ---
    const flowStore = useFlowStore()
    const { nodes, edges, nodeBlocks, history, historyIndex } = storeToRefs(flowStore)

    // --- Computed Properties ---
    const canUndo = computed(() => historyIndex.value > 0)
    const canRedo = computed(() => historyIndex.value < history.value.length - 1)

    // --- Vue Flow Hooks ---
    const vueFlowApi = useVueFlow()
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
    } = vueFlowApi

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
        console.log('🔧 Initializing controlled flow events')

        onNodesChange((changes) => {
            console.log('📊 Node changes received:', changes)

            // Process each change and determine if we should apply it
            const validatedChanges = []

            for (const change of changes) {
                console.log(`Processing change type: ${change.type}`, change)

                // For controlled flows, we validate changes and decide whether to apply them
                // This is where you'd add validation logic (e.g. confirm on delete)
                validatedChanges.push(change)
            }

            console.log('✅ Applying validated changes through Vue Flow internal API:', validatedChanges)

            // CONTROLLED FLOW: Apply changes through Vue Flow's internal API
            // With :apply-default="false", we have full control over which changes get applied
            // v-model automatically syncs Vue Flow's internal state back to our store
            // NOTE: applyNodeChanges is deprecated but still the working pattern until
            // the replacement "store instance" approach is properly documented
            // See: https://github.com/bcakmakoglu/vue-flow/discussions/1884
            applyNodeChanges(validatedChanges)

            // No need for manual applyChanges() - v-model handles store synchronization

            // FIX: v-model updates are not synchronous. We must wait for the next
            // DOM update cycle to ensure the store's `nodes` ref is updated
            // before we try to save the state to history.
            nextTick(() => {
                console.log('📝 Changes applied, store nodes:', nodes.value.length)
                // Notify the store to save history for significant changes
                flowStore.onNodesChange(validatedChanges)
            })
        })

        onEdgesChange((changes) => {
            console.log('🔗 Edge changes received:', changes)

            // Process each change and determine if we should apply it
            const validatedChanges = []

            for (const change of changes) {
                console.log(`Processing edge change type: ${change.type}`, change)

                // For controlled flows, we validate changes and decide whether to apply them
                validatedChanges.push(change)
            }

            console.log('✅ Applying validated edge changes through Vue Flow internal API:', validatedChanges)

            // CONTROLLED FLOW: Apply changes through Vue Flow's internal API
            // With :apply-default="false", we have full control over which changes get applied
            // v-model automatically syncs Vue Flow's internal state back to our store
            // NOTE: applyEdgeChanges is deprecated but still the working pattern until
            // the replacement "store instance" approach is properly documented
            // See: https://github.com/bcakmakoglu/vue-flow/discussions/1884
            applyEdgeChanges(validatedChanges)

            // No need for manual applyChanges() - v-model handles store synchronization

            // FIX: v-model updates are not synchronous. We must wait for the next
            // DOM update cycle to ensure the store's `edges` ref is updated
            // before we try to save the state to history.
            nextTick(() => {
                console.log('🔗 Edge changes applied, store edges:', edges.value.length)
                // Notify the store to save history
                flowStore.onEdgesChange(validatedChanges)
            })
        })

        // We handle onConnect here in the controller to ensure the correct event is emitted.
        onConnect((connection) => {
            // TODO: HIGH_PRIORITY - Remove debug console.log statements for production
            console.log('🔌 New connection:', connection)
            console.log('🔍 Source handle:', connection.sourceHandle)

            // TODO: HIGH_PRIORITY - Add edge validation to prevent duplicate connections from same branch
            // Current implementation allows multiple edges from the same condition branch handle

            const newEdge = {
                ...connection,
                id: connection.id || generateId('edge'),
            }

            // Check if this connection is from a condition branch handle
            // Now we just need to check if the sourceHandle is a block ID from any condition node
            const branchId = connection.sourceHandle
            if (branchId) {
                console.log('🔍 Checking if handle is a condition branch:', branchId)

                // Search through all condition nodes to find the branch
                let foundBranch = null
                let sourceNodeId = null

                // TODO: MED_PRIORITY - Cache node type lookups for performance with large flows
                // Current O(n*m) search could be optimized with indexed lookups
                for (const node of nodes.value) {
                    if (node.type === NODE_TYPES.CONDITION) {
                        const sourceBlocks = nodeBlocks.value[node.id] || []
                        const branch = sourceBlocks.find((b) => b.id === branchId && b.type === 'condition-branch')
                        if (branch) {
                            foundBranch = branch
                            sourceNodeId = node.id
                            break
                        }
                    }
                }

                if (foundBranch && sourceNodeId) {
                    console.log('✅ Found condition branch:', foundBranch, 'on node:', sourceNodeId)
                    newEdge.data = {
                        ...newEdge.data,
                        branchId: branchId,
                        branchLabel: foundBranch.data.label || `Branch ${branchId}`,
                        conditionExpression: foundBranch.data.condition ?? '',
                        isConditionBranch: true,
                    }
                    console.log(`🔀 Adding condition branch edge for "${foundBranch.data.label}"`, newEdge.data)
                } else {
                    console.log('🔍 Handle is not a condition branch, treating as regular connection')
                }
            }

            console.log('➕ Adding new edge:', newEdge)

            // Using the library's action ensures a *single*, clean `onEdgesChange` event is emitted.
            addEdges([newEdge])
        })
    }

    /**
     * Restores the previous state from history.
     * It gets the state object from the store and uses imperative Vue Flow actions
     * to force the view to update to that state.
     */
    async function undo() {
        console.log('⏪ Undo requested')
        const stateToRestore = flowStore.undo()
        if (stateToRestore) {
            console.log('📖 Restoring state from history:', stateToRestore)

            // Set flag to prevent history saves during restoration
            flowStore.setRestoringHistory(true)

            // TODO: Revisit this implementation.
            // This is a workaround for a reactivity issue where Vue Flow doesn't
            // reliably update its view when the :nodes and :edges props are
            // programmatically replaced, especially when items are removed.
            // The "empty-then-set" pattern with nextTick forces a full re-render.
            nodes.value = []
            edges.value = []
            await nextTick()

            // Now, apply the actual restored state
            nodes.value = stateToRestore.nodes
            edges.value = stateToRestore.edges
            nodeBlocks.value = stateToRestore.nodeBlocks || {}

            // TODO: FEATURE - Add user feedback (e.g., toast notification)
            // to confirm that the action was successful.
            flowStore.setRestoringHistory(false)
        } else {
            console.log('❌ No state to restore (at beginning of history)')
        }
    }

    /**
     * Restores the next state from history.
     * It gets the state object from the store and uses imperative Vue Flow actions
     * to force the view to update to that state.
     */
    async function redo() {
        console.log('⏩ Redo requested')
        const stateToRestore = flowStore.redo()
        if (stateToRestore) {
            console.log('📖 Restoring state from history:', stateToRestore)

            // Set flag to prevent history saves during restoration
            flowStore.setRestoringHistory(true)

            // TODO: Revisit this implementation.
            // This is a workaround for a reactivity issue where Vue Flow doesn't
            // reliably update its view when the :nodes and :edges props are
            // programmatically replaced, especially when items are removed.
            // The "empty-then-set" pattern with nextTick forces a full re-render.
            nodes.value = []
            edges.value = []
            await nextTick()

            // Now, apply the actual restored state
            nodes.value = stateToRestore.nodes
            edges.value = stateToRestore.edges
            nodeBlocks.value = stateToRestore.nodeBlocks || {}

            // TODO: FEATURE - Add user feedback (e.g., toast notification)
            // to confirm that the action was successful.
            flowStore.setRestoringHistory(false)
        } else {
            console.log('❌ No state to restore (at end of history)')
        }
    }

    /**
     * Jumps to a specific state in history and applies it.
     * This function gets a specific state object from the store and uses
     * imperative Vue Flow actions to force the view to update.
     * @param {number} index - The history index to jump to.
     */
    async function jumpToHistoryState(index) {
        console.log(`⏯️ Jumping to history state ${index}`)
        const stateToRestore = flowStore.jumpToState(index)

        if (stateToRestore) {
            console.log('📖 Restoring state from history:', stateToRestore)

            // Set flag to prevent history saves during restoration
            flowStore.setRestoringHistory(true)

            // Apply the same "empty-then-set" pattern as undo/redo for reactivity
            nodes.value = []
            edges.value = []
            await nextTick()

            // Now, apply the actual restored state
            nodes.value = stateToRestore.nodes
            edges.value = stateToRestore.edges
            nodeBlocks.value = stateToRestore.nodeBlocks || {}

            flowStore.setRestoringHistory(false)
        } else {
            console.log(`❌ Invalid history index: ${index}`)
        }
    }

    /**
     * Imports flow data with proper Vue Flow state synchronization.
     * This method handles the Vue Flow reactivity issue by using the same
     * "empty-then-set" pattern as undo/redo to force a complete re-render.
     */
    async function importFlow(flowData, clearHistoryOnImport = true) {
        console.log('📥 Importing flow data:', flowData.name)

        // Set flag to prevent history saves during import
        flowStore.setRestoringHistory(true)

        // Use the same "empty-then-set" pattern as undo/redo to force Vue Flow re-render
        nodes.value = []
        edges.value = []
        nodeBlocks.value = {}
        await nextTick()

        // Call the store import method to validate and set the data
        const success = flowStore.importFlow(flowData, clearHistoryOnImport)

        if (success) {
            // State is already set by flowStore.importFlow, but we need to ensure
            // Vue Flow picks up the changes by accessing the reactive refs
            console.log('📍 Applying imported nodes and edges to Vue Flow')

            // The store has already updated the reactive refs, but we ensure
            // Vue Flow sees the changes by triggering reactivity
            await nextTick()

            console.log('✅ Import completed with proper Vue Flow synchronization')
        }

        // Reset restoration flag (store method already does this, but being explicit)
        flowStore.setRestoringHistory(false)

        return success
    }

    /**
     * Exports flow data using the store method.
     */
    function exportFlow(options = {}) {
        return flowStore.exportFlow(options)
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
            // Count existing nodes of the same type to generate a numbered title
            const count = nodes.value.filter((n) => n.type === nodeData.type).length + 1
            const typeName = nodeData.type.replace('custom-', '').replace('-', ' ')
            const defaultTitle = `${typeName.charAt(0).toUpperCase() + typeName.slice(1)} #${count}`

            const newNode = {
                ...nodeData,
                id: generateId(),
                data: {
                    ...nodeData.data,
                    title: nodeData.data.title || defaultTitle,
                },
            }

            if (
                nodeData.type === NODE_TYPES.SETUP ||
                nodeData.type === NODE_TYPES.LECTURE ||
                nodeData.type === NODE_TYPES.CONDITION
            ) {
                nodeBlocks.value[newNode.id] = []
                newNode.data.hasBlocks = true
            }

            // Use the Vue Flow action to add the node.
            // This will trigger the `onNodesChange` event with the correct 'add' type,
            // which our store will then use to save the history state.
            addNodes([newNode])
        },

        updateNodeData: (nodeId, data) => {
            flowStore.updateNodeData(nodeId, data)
        },

        // --- Edge Operations ---

        // --- Block Operations ---
        updateBlock: flowStore.updateBlock,
        addBlock: flowStore.addBlock,
        removeBlock: flowStore.removeBlock,
        reorderBlocks: flowStore.reorderBlocks,
        getNodeBlocks: flowStore.getNodeBlocks,
        getAssetById: flowStore.getAssetById,
        getAvailableAssets: flowStore.getAvailableAssets,

        // --- History Operations ---
        undo,
        redo,
        canUndo,
        canRedo,
        flushPendingSaves: flowStore.flushPendingSaves,
        getHistoryStats: flowStore.getHistoryStats,
        jumpToHistoryState,
        clearHistory: flowStore.clearHistory,

        // --- Viewport Operations ---
        fitToView: fitView,
        zoomIn,
        zoomOut,

        // --- Setup ---
        initFlowEvents,

        // --- Utility ---
        saveState: flowStore.saveState,

        // --- Import/Export Operations ---
        exportFlow,
        importFlow,

        // --- Raw Vue Flow API (for advanced use cases) ---
        vueFlowApi,
    }
}
