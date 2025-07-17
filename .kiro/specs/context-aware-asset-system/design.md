# Design Document

## Overview

The context-aware asset system introduces intelligent asset inheritance and context-dependent block behavior to the flow editor. This system enhances the existing manual asset selection by adding automatic context propagation based on execution flow. Blocks can inherit assets from their execution path and filter available options based on the current context, reducing the need for repetitive manual asset selection while preserving the assets-applied block as the primary mechanism for setting context.

The system maintains the existing linear execution flow constraints while adding reactive context management that automatically updates when assets are applied, removed, or when the flow structure changes.

## Architecture

### Core Components

#### 1. Context Manager (`src/services/context-manager.js`)

Central service responsible for calculating and managing execution context for each node in the flow.

**Key Responsibilities:**

- Calculate execution paths from start node to any given node
- Determine asset context inheritance based on flow execution order
- Provide reactive context updates when flow structure or assets change
- Handle context merging for nodes with multiple incoming paths

#### 2. Asset Context Store (`src/stores/asset-context-store.js`)

Pinia store managing the reactive asset context state for all nodes.

**Key Responsibilities:**

- Store current asset context for each node
- Provide reactive getters for context-dependent block filtering
- Handle context invalidation and recalculation triggers
- Manage context change notifications

#### 3. Context-Aware Composable (`src/composables/use-asset-context.js`)

Vue composable providing context-aware functionality to blocks.

**Key Responsibilities:**

- Provide filtered options based on current node context
- Handle context-dependent block behavior
- Manage context inheritance for block components
- Provide utilities for context-aware validation

#### 4. Enhanced Flow Editor Composable

Extended `useFlowEditor` with context management integration.

**Key Responsibilities:**

- Trigger context recalculation on flow structure changes
- Handle asset application context updates
- Manage context cleanup on node/asset deletion

### Context Data Structure

```javascript
// Node Context Structure
{
  nodeId: string,
  inheritedAssets: {
    image: {
      assetId: string,
      assetData: object,
      sourceNodeId: string,
      appliedAt: timestamp
    } | null,
    lms: {
      assetId: string,
      assetData: object,
      sourceNodeId: string,
      appliedAt: timestamp,
      questionData: object | null
    } | null
  },
  availableAssets: {
    image: Asset[],
    lms: Asset[]
  },
  executionPath: string[], // Array of node IDs in execution order
  lastUpdated: timestamp
}
```

## Components and Interfaces

### Context Manager Service

```javascript
/**
 * Central service for calculating and managing execution context
 * @class ContextManager
 */
class ContextManager {
    /**
     * Calculate execution path from start to target node
     * @param {string} targetNodeId - The target node ID
     * @returns {string[]} Array of node IDs in execution order
     */
    calculateExecutionPath(targetNodeId) {
        /* ... */
    }

    /**
     * Get inherited context for a specific node
     * @param {string} nodeId - The node ID
     * @returns {Object} NodeContext object
     */
    getNodeContext(nodeId) {
        /* ... */
    }

    /**
     * Update context when assets are applied
     * @param {string} nodeId - The node ID
     * @param {string} assetType - Type of asset (image/lms)
     * @param {Object} assetData - Asset data object
     */
    updateAssetContext(nodeId, assetType, assetData) {
        /* ... */
    }

    /**
     * Recalculate context for all affected nodes
     * @param {string} [changedNodeId] - Optional node ID that triggered the change
     */
    recalculateContext(changedNodeId) {
        /* ... */
    }

    /**
     * Get available assets filtered by execution path
     * @param {string} nodeId - The node ID
     * @returns {Object} Available assets object
     */
    getAvailableAssetsForNode(nodeId) {
        /* ... */
    }
}
```

### Asset Context Store

```javascript
const useAssetContextStore = defineStore('assetContext', () => {
    // State
    const nodeContexts = ref(new Map())
    const contextVersion = ref(0)

    // Getters
    const getContextForNode = (nodeId) => nodeContexts.value.get(nodeId)
    const getFilteredMethodsForNode = (nodeId) => {
        /* LMS-based filtering */
    }
    const getFilteredActionsForNode = (nodeId) => {
        /* Asset-based filtering */
    }
    const getFilteredConditionsForNode = (nodeId) => {
        /* LMS-based filtering */
    }

    // Actions
    const updateNodeContext = (nodeId, context) => {
        /* ... */
    }
    const invalidateContext = (nodeId) => {
        /* ... */
    }
    const recalculateAllContexts = () => {
        /* ... */
    }

    return {
        nodeContexts,
        contextVersion,
        getContextForNode,
        getFilteredMethodsForNode,
        getFilteredActionsForNode,
        getFilteredConditionsForNode,
        updateNodeContext,
        invalidateContext,
        recalculateAllContexts,
    }
})
```

### Context-Aware Composable

```javascript
/**
 * Vue composable providing context-aware functionality to blocks
 * @param {string} nodeId - The node ID
 * @returns {Object} Context-aware utilities and reactive state
 */
export function useAssetContext(nodeId) {
    const contextStore = useAssetContextStore()
    const flowStore = useFlowStore()

    // Reactive context for current node
    const nodeContext = computed(() => contextStore.getContextForNode(nodeId))

    // Context-dependent filtering functions
    const getFilteredMethods = (blockType) => {
        /* ... */
    }
    const getFilteredActions = () => {
        /* ... */
    }
    const getFilteredTargets = (actionType) => {
        /* ... */
    }
    const getFilteredConditions = () => {
        /* ... */
    }

    // Asset inheritance utilities
    const getInheritedImageAsset = () => nodeContext.value?.inheritedAssets.image
    const getInheritedLmsAsset = () => nodeContext.value?.inheritedAssets.lms

    // Context update functions
    const applyAsset = (assetType, assetId) => {
        /* ... */
    }
    const removeAssetFromContext = (assetType) => {
        /* ... */
    }

    return {
        nodeContext,
        getFilteredMethods,
        getFilteredActions,
        getFilteredTargets,
        getFilteredConditions,
        getInheritedImageAsset,
        getInheritedLmsAsset,
        applyAsset,
        removeAssetFromContext,
    }
}
```

## Data Models

### Asset Context Model

```javascript
/**
 * Asset reference in context
 * @typedef {Object} AssetContext
 * @property {string} assetId - The asset ID
 * @property {Object} assetData - Asset data object
 * @property {string} sourceNodeId - Node ID where asset was applied
 * @property {number} appliedAt - Timestamp when asset was applied
 * @property {Object} [questionData] - For LMS assets with questions
 */

/**
 * Node execution context
 * @typedef {Object} NodeContext
 * @property {string} nodeId - The node ID
 * @property {Object} inheritedAssets - Inherited assets from execution path
 * @property {AssetContext|null} inheritedAssets.image - Inherited image asset
 * @property {AssetContext|null} inheritedAssets.lms - Inherited LMS asset
 * @property {Object} availableAssets - Available assets for manual selection
 * @property {Array} availableAssets.image - Available image assets
 * @property {Array} availableAssets.lms - Available LMS assets
 * @property {string[]} executionPath - Array of node IDs in execution order
 * @property {number} lastUpdated - Last update timestamp
 */

/**
 * Context-dependent filtering options
 * @typedef {Object} FilteringOptions
 * @property {Array} methods - Available method options
 * @property {Array} actions - Available action options
 * @property {Array} targets - Available target options
 * @property {Array} conditions - Available condition options
 */
```

### Enhanced Block Data Models

```javascript
/**
 * Enhanced Collect User Data Block
 * @typedef {Object} CollectUserDataBlockData
 * @property {string} title - Block title
 * @property {string[]} methods - Selected collection methods
 * @property {string} saveTo - Variable to save data to
 * @property {boolean} contextFiltered - Indicates if methods are context-filtered
 */

/**
 * Enhanced System Action Block
 * @typedef {Object} SystemActionBlockData
 * @property {string} title - Block title
 * @property {string} action - Selected action type
 * @property {number} delay - Action delay in seconds
 * @property {string[]} methods - Selected action methods
 * @property {string[]} targets - Selected action targets
 * @property {boolean} contextFiltered - Indicates if options are context-filtered
 */

/**
 * Enhanced Condition Branch Block
 * @typedef {Object} ConditionBranchBlockData
 * @property {string} title - Block title
 * @property {string} condition - Condition expression
 * @property {'manual'|'context-based'} conditionType - Type of condition
 * @property {string} [contextExpression] - For context-based conditions
 */
```

## Error Handling

### Context Calculation Errors

- **Circular Dependencies**: Detect and prevent infinite loops in execution path calculation
- **Orphaned Nodes**: Handle nodes not connected to the execution flow
- **Invalid Asset References**: Clean up references to deleted assets

### Context Synchronization Errors

- **Race Conditions**: Use version numbers to prevent conflicting context updates
- **Memory Leaks**: Implement proper cleanup for removed nodes
- **Performance Issues**: Cache context calculations and use incremental updates

### User Experience Errors

- **Asset Deletion Warnings**: Show comprehensive impact analysis before deletion
- **Context Loss Notifications**: Alert users when context changes affect block behavior
- **Validation Errors**: Provide clear feedback for invalid context-dependent configurations

## Testing Strategy

// TODO: Implement comprehensive testing strategy including:
// - Unit tests for ContextManager (execution path calculation, context updates)
// - Unit tests for AssetContextStore (context storage, filtering, reactive updates)
// - Unit tests for useAssetContext composable (filtering functions, asset inheritance)
// - Integration tests for flow editor context integration
// - Integration tests for context-aware block behavior
// - End-to-end tests for user workflows with context inheritance
// - Performance tests for context calculation and reactive updates

## Implementation Phases

### Phase 1: Core Context Infrastructure

1. Implement ContextManager service with execution path calculation
2. Create AssetContextStore with basic context storage
3. Add context calculation triggers to flow editor
4. Implement basic context inheritance for assets-applied blocks

### Phase 2: Context-Dependent Block Behavior

1. Enhance collect-user-data-block with LMS-based method filtering
2. Update system-action-block with asset-based action/target filtering
3. Modify condition-branch-block with context-based expression options
4. Add context indicators to block UIs

### Phase 3: Reference Management and Cleanup

1. Implement asset deletion impact analysis
2. Add context cleanup on asset/node removal
3. Create context change notifications
4. Add validation for context-dependent configurations

### Phase 4: Performance Optimization and Polish

1. Implement context caching and incremental updates
2. Add comprehensive error handling and recovery
3. Optimize reactive update performance
4. Add user experience enhancements (loading states, transitions)

## Migration Strategy

### Backward Compatibility

- Existing flows continue to work with manual asset selection as fallback
- Context-aware features are opt-in through block configuration
- Legacy block data structures remain supported

### Gradual Migration

1. **Phase 1**: New context system runs alongside existing asset system
2. **Phase 2**: Blocks automatically detect and use context when available
3. **Phase 3**: Context becomes primary system with manual selection as fallback
4. **Phase 4**: Full context-aware system with optional manual overrides

### Data Migration

- No immediate data migration required
- Context is calculated dynamically from existing flow structure
- Asset references are preserved and enhanced with context information
- Block configurations are backward compatible with new context fields
