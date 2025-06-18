# Flow Forge - Custom Nodes Architecture

## 🎯 Overview

This document defines the architecture for **Phase 2: Custom Nodes with Linear Sub-Block Stacking** in Flow Forge. The system implements Chatfuel-style nodes with nested blocks while maintaining clean separation of concerns and scalability.

## 🏗️ Core Architecture Decisions

### **Database Strategy: Enhanced Single Document (MongoDB)**
- **Rationale**: Balance between implementation simplicity and scalability for initial phases.
- **Document Size Target**: < 1MB per flow (comfortable for MongoDB 16MB limit).
- **Asset Strategy**: CDN URLs only (no binary data in database).
- **Concurrency**: A `_version` field will be used for optimistic locking.
- **Migration Path**: Structure designed for future separation of `nodeBlocks` into its own collection.

### **Node Categories**
1. **Nestable Nodes** (with block arrays):
   - **Setup/Config Node**: Centralized definitions for variables, assets, and reusable resources.
   - **Lecture Node**: Main content delivery node, containing a sequence of content and action blocks.

2. **Simple Nodes** (single purpose):
   - **Input/Start Node**: Flow entry point.
   - **Output/End Node**: Flow termination point.
   - **Condition Node**: Decision-making logic.

### **Asset Reusability Pattern**
- **Setup Nodes**: Define reusable assets (images, videos, variables)
- **Assets Applied Blocks**: Reference setup node assets in lecture nodes
- **No direct cross-node sharing**: Assets only reused through setup → reference pattern

## 📊 Data Structure (Enhanced Single Document)

This is the primary JSON structure for a flow, designed to be stored in a MongoDB document.

```javascript
{
  id: "flow-uuid",
  name: "My Learning Flow",
  description: "A comprehensive flow about...",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  _version: 42, // Monotonically incrementing version for concurrency control
  
  // Vue Flow viewport state
  viewport: { x: 0, y: 0, zoom: 1 },
  
  // Vue Flow structure (lightweight)
  nodes: [
    {
      id: "node-1",
      type: "custom-start",
      position: { x: 100, y: 100 },
      data: {
        title: "Welcome",
        config: {
          message: "Welcome to the course!",
          nextAction: "continue"
        }
      }
    },
    {
      id: "node-2", 
      type: "custom-lecture",
      position: { x: 100, y: 200 },
      data: {
        title: "Introduction Lesson",
        hasBlocks: true // Flag for Vue Flow rendering
      }
    }
  ],
  
  edges: [
    {
      id: "edge-1",
      source: "node-1",
      target: "node-2",
      animated: false
    }
  ],
  
  // Blocks organized by node ID (easier management)
  nodeBlocks: {
    "node-2": [
      {
        id: "block-1",
        type: "teacher-video",
        data: {
          videoUrl: "https://cdn.example.com/videos/intro.mp4",
          title: "Introduction Video",
          startTime: 0,
          endTime: 30,
          autoplay: true,
          showControls: true
        }
      },
      {
        id: "block-2",
        type: "assets-applied", 
        data: {
          setupNodeId: "setup-node-1",
          assetId: "welcome-image",
          displayDuration: 5000,
          showCaption: true
        }
      },
      {
        id: "block-3",
        type: "question",
        data: {
          question: "What did you learn?",
          inputType: "text",
          required: true,
          variableName: "lesson-1-answer"
        }
      }
    ],
    "setup-node-1": [
      {
        id: "setup-block-1",
        type: "asset-image",
        data: {
          assetId: "welcome-image",
          imageUrl: "https://cdn.example.com/images/welcome.jpg",
          title: "Welcome Image",
          alt: "Course welcome banner"
        }
      }
    ]
  },
  
  // Size monitoring for migration planning
  _meta: {
    documentSize: 156000, // bytes
    nodeCount: 15,
    totalBlocks: 45,
    lastModified: "2024-01-15T10:30:00Z",
    version: "2.1" // Data structure version, not to be confused with _version
  }
}
```

### **Enhanced Node Structure**

All nodes, regardless of type, will follow this basic structure, compatible with Vue Flow.

```javascript
{
  // --- Vue Flow Required Properties ---
  id: "node-uuid",
  type: "custom-start", // e.g., custom-start, custom-end, custom-setup
  position: { x: 100, y: 200 },
  
  // --- Our Enhanced Properties ---
  data: {
    title: "Welcome Message", // The primary label displayed in the node's UI.
    config: { ... }           // An object for type-specific settings. It may be empty
                              // for simple nodes like Start/End but is kept for
                              // architectural consistency.
  }
}
```

### **Block Type Definitions**

#### **Setup Node Blocks**
```javascript
// Image Asset Block
{
  id: "block-uuid",
  type: "asset-image",
  data: {
    assetId: "unique-asset-id", // For referencing
    imageUrl: "https://cdn.../image.jpg",
    title: "Asset Title",
    alt: "Image description"
  }
}

// Video Asset Block  
{
  id: "block-uuid",
  type: "asset-video",
  data: {
    assetId: "unique-asset-id",
    videoUrl: "https://cdn.../video.mp4", 
    title: "Video Title",
    duration: 120,
    thumbnail: "https://cdn.../thumb.jpg"
  }
}
```

#### **Lecture Node Blocks**
```javascript
// Teacher Video Block
{
  id: "block-uuid",
  type: "teacher-video",
  data: {
    videoUrl: "https://cdn.../lesson.mp4",
    title: "Lesson Introduction", 
    startTime: 0,
    endTime: null, // null = full video
    autoplay: true,
    showControls: true,
    skipAllowed: false
  }
}

// Assets Applied Block (References Setup Node)
{
  id: "block-uuid",
  type: "assets-applied",
  data: {
    setupNodeId: "setup-node-1",
    assetId: "welcome-image", // References setup node asset
    displayDuration: 5000, // ms, null = manual advance
    showCaption: true,
    customCaption: "Welcome to our course!" // Override asset title
  }
}

// Question Block
{
  id: "block-uuid", 
  type: "question",
  data: {
    question: "What is your name?",
    inputType: "text", // "text", "number", "select", "multiselect"
    options: [], // for select types
    required: true,
    variableName: "user-name",
    validation: {
      minLength: 2,
      maxLength: 50
    }
  }
}

// Collect User Answer Block
{
  id: "block-uuid",
  type: "collect-answer",
  data: {
    prompt: "Please submit your answer",
    collectFrom: "lesson-1-answer", // Variable to collect
    showSummary: true,
    nextAction: "continue" // "continue", "wait", "redirect"
  }
}

// System Action Block
{
  id: "block-uuid",
  type: "system-action",
  data: {
    action: "set-variable", // "set-variable", "api-call", "send-notification"
    variableName: "completion-status",
    value: "lesson-1-completed"
    // For API calls:
    // apiEndpoint: "https://api.../progress",
    // apiMethod: "POST",
    // apiData: { userId: "{{user-id}}", lesson: "lesson-1" }
  }
}
```

#### **Condition Node Structure**
```javascript
// Condition node with nested branch nodes
{
  id: "condition-node-1",
  type: "custom-condition", 
  position: { x: 100, y: 300 },
  data: {
    nodeType: "condition",
    title: "Check User Input",
    // Condition branches as nested nodes (Vue Flow pattern)
    conditionBranches: [
      {
        id: "branch-node-1",
        type: "condition-branch",
        condition: "user-name !== ''",
        label: "Has Name",
        position: { x: 50, y: 150 }, // Relative to parent
        data: { 
          targetNodeId: "next-node-1",
          branchColor: "#22c55e"
        }
      },
      {
        id: "branch-node-2",
        type: "condition-branch", 
        condition: "user-name === ''",
        label: "No Name",
        position: { x: 50, y: 200 },
        data: {
          targetNodeId: "error-node-1", 
          branchColor: "#ef4444"
        }
      }
    ]
  }
}
```

## 🚨 Architecture Considerations & Future Improvements

This section captures critical architectural considerations, potential risks, and planned improvements to ensure the long-term health and scalability of the project.

### ✅ **Data Integrity and Validation**

- **Single Start Node**: A flow must have exactly one Start Node (`type: 'custom-start'`). The UI should prevent the creation of additional start nodes and provide validation warnings if a flow is loaded without one (or with more than one).
- **Node/Block Sync**: We need server-side validation to ensure that any node with `data.hasBlocks: true` has a corresponding `nodeBlocks[node.id]` entry. The editor should surface a warning if this relationship is broken to prevent data desynchronization.
- **Asset Deletion**: Before a `Setup Node` can be deleted, the system must scan all `Lecture Nodes` for `assets-applied` blocks that reference it. Deletion should be blocked if references exist, or the user must be prompted to resolve the orphaned blocks.
- **Dangling Edges**: When a `Condition Node` branch is deleted or retargeted, the system must automatically find and detach any edges connected to that branch's handle in the same transaction to prevent dangling edges.

### 📈 **Scalability and Performance**

- **Concurrency Control**: The current `_version` field provides basic optimistic locking. For real-time collaboration, we will need to investigate and integrate a CRDT (Conflict-free Replicated Data Type) library like **Yjs** or **Automerge**.
- **Patch-Based Saves**: Saving the entire document on every edit will become slow. We must plan to switch to a patch-based writing system (e.g., JSON Patch) or move to a separate `blocks` collection where changes are more granular.
- **Render Performance**: Nodes with a large number of blocks may cause UI jank. We should implement virtual scrolling within the node components to only render visible blocks.
- **Database Migration**: The future split of `nodeBlocks` into a separate collection will require a carefully planned migration. A draft script should be prepared to: 1) Read the existing flow document. 2) Create new documents in the `blocks` collection for each entry in `nodeBlocks`. 3) Update the original flow document to remove the embedded `nodeBlocks`.

### 🔒 **Security and Stability**

- **Safe Expression Evaluation**: Storing condition logic as raw code strings is a security risk. We will replace this with a safe, sandboxed expression DSL. A subset of **JSONata** is a strong candidate for this.
- **Immutable History**: The current undo/redo system relies on deep cloning (`JSON.stringify`), which is inefficient. For more robust state management, we should adopt an Immer-like library for Vue (e.g., `immer` itself can be used) to automatically generate immutable state patches.

### 💡 **Code Quality & Refactoring**

- **Shared Node Component Patterns**: To ensure a consistent UI and developer experience, nodes are built using a composable pattern that distinguishes between UI, block layout, and node nesting:
  - **`Simple Nodes`** (`Start`, `End`): Implemented as standalone components with a unique, non-card UI.
  - **`Card Nodes`**: A general category for all non-simple nodes. They use **`CardNodeWrapper.vue`** to provide a consistent card shell with a header.
  - **`Block Nodes`** (`Setup`, `Lecture`): A subset of Card Nodes. They compose **`CardNodeWrapper.vue`** for the shell and **`BlockContainer.vue`** for the UI of the nested block list. They render data from the `nodeBlocks` object.
  - **`Parent Nodes`** (`Condition`): A subset of Card Nodes. They are responsible for rendering their own children (which are actual nodes from the main `nodes` array) inside their default slot. This enables true node-in-node nesting.
- **ID Namespacing**: To prevent ID collisions between nodes and condition branches, branch handles (which are technically nodes) will be namespaced (e.g., `node-id:branch-a`) or use UUIDs generated by the same `generateId` utility.

## 🎯 Vue Flow Integration

### **Custom Node Types Registration**
```javascript
// In flow-editor.vue
const nodeTypes = {
  'custom-start': StartNode,
  'custom-end': EndNode, 
  'custom-setup': SetupNode,
  'custom-lecture': LectureNode,
  'custom-condition': ConditionNode,
  'condition-branch': ConditionBranchNode
}
```

### **Component Structure**
```
src/components/
├── nodes/
│   ├── start-node.vue           # Simple welcome/start node
│   ├── end-node.vue             # Simple termination node
│   ├── setup-node.vue           # Asset management node
│   ├── lecture-node.vue         # Main content node (most complex)
│   ├── condition-node.vue       # Decision making node  
│   └── condition-branch-node.vue # Branch sub-node
├── blocks/
│   ├── teacher-video-block.vue  # Video player block
│   ├── question-block.vue       # Question/input block
│   ├── assets-applied-block.vue # Asset reference block
│   ├── collect-answer-block.vue # Answer collection block
│   ├── system-action-block.vue  # System actions block
│   ├── asset-image-block.vue    # Image asset (setup)
│   └── asset-video-block.vue    # Video asset (setup)
└── shared/
    ├── block-wrapper.vue        # Common block container
    └── block-toolbar.vue        # Add/edit/delete blocks
```

## 🔧 Implementation Plan

### **Phase 1: Foundation (Week 1)**
1. ✅ **Update Data Structure**: Enhance flow store for nodeBlocks
2. ✅ **Basic Node Registration**: Register custom node types with Vue Flow
3. ✅ **Simple Nodes First**: Implement Start and End nodes (no blocks)

### **Phase 2: Setup Node (Week 2)** 
1. ✅ **Setup Node Component**: Basic container with block support
2. ✅ **Asset Blocks**: Image and Video asset blocks
3. ✅ **Block Management**: Add/remove/reorder blocks within nodes
4. ✅ **Asset ID System**: Unique IDs for cross-referencing

### **Phase 3: Lecture Node (Week 3-4)**
1. ✅ **Lecture Node Component**: Complex container with multiple block types
2. ✅ **Content Blocks**: Teacher Video, Question blocks  
3. ✅ **Reference Blocks**: Assets Applied block (references setup nodes)
4. ✅ **Action Blocks**: Collect Answer, System Action blocks
5. ✅ **Inline Editing**: Block-level editing within nodes

### **Phase 4: Condition Node (Week 5)**
1. ✅ **Condition Logic**: Single condition block with multiple branches
2. ✅ **Branch Nodes**: Nested nodes for each condition outcome
3. ✅ **Edge Management**: Automatic edge creation from branches

### **Phase 5: Polish & Testing (Week 6)**
1. ✅ **UI Polish**: Consistent styling across all node/block types
2. ✅ **Performance**: Optimize rendering for flows with many blocks
3. ✅ **Error Handling**: Validation and error boundaries
4. ✅ **Documentation**: Component and API documentation

## 🛠️ Flow Store Updates

### **Enhanced Store Methods**
```javascript
// Block management methods to add to flow-store.js
function updateBlock(nodeId, blockId, newData) {
  const nodeBlocks = nodes.value.find(n => n.id === nodeId)?.blocks || []
  const blockIndex = nodeBlocks.findIndex(b => b.id === blockId)
  if (blockIndex !== -1) {
    nodeBlocks[blockIndex].data = { ...nodeBlocks[blockIndex].data, ...newData }
    saveState()
  }
}

function addBlock(nodeId, blockData) {
  if (!flowData.nodeBlocks[nodeId]) {
    flowData.nodeBlocks[nodeId] = []
  }
  flowData.nodeBlocks[nodeId].push({
    id: generateId(),
    ...blockData
  })
  saveState()
}

function removeBlock(nodeId, blockId) {
  if (flowData.nodeBlocks[nodeId]) {
    flowData.nodeBlocks[nodeId] = flowData.nodeBlocks[nodeId].filter(b => b.id !== blockId)
    saveState()
  }
}

function reorderBlocks(nodeId, fromIndex, toIndex) {
  const blocks = flowData.nodeBlocks[nodeId]
  if (blocks) {
    const [removed] = blocks.splice(fromIndex, 1)
    blocks.splice(toIndex, 0, removed)
    saveState()
  }
}

// Asset reference resolution
function getAssetFromSetup(setupNodeId, assetId) {
  const setupBlocks = flowData.nodeBlocks[setupNodeId] || []
  return setupBlocks.find(block => 
    block.type.startsWith('asset-') && 
    block.data.assetId === assetId
  )
}
```

## 📈 Scalability Considerations

### **Document Size Monitoring**
- **Target**: < 1MB per flow document
- **Typical Block Size**: ~300 bytes (with CDN URLs)
- **Estimated Capacity**: ~3,000 blocks per flow before optimization needed
- **Warning Thresholds**: 
  - 50+ blocks per node: UI warning
  - 500KB document: Performance alert
  - 1MB document: Migration recommendation

### **Migration Path (Future)**
When document size becomes an issue:
1. **Separate Blocks Collection**: Extract nodeBlocks to separate MongoDB collection
2. **Reference-Based Loading**: Replace block arrays with block ID arrays
3. **Lazy Loading**: Load blocks on-demand as nodes are viewed
4. **Pagination**: Implement block pagination for very large nodes

### **Performance Optimizations**
- **Block Virtualization**: For nodes with 20+ blocks
- **Asset Preloading**: Prefetch referenced assets
- **Incremental Saves**: Only save changed blocks, not entire document
- **Caching**: Cache rendered block components

## 🔍 Asset Reference System

### **Setup Node → Lecture Node Flow**
1. **Define in Setup**: Create image/video assets in setup node with unique `assetId`
2. **Reference in Lecture**: Use "assets-applied" block with `setupNodeId` + `assetId`
3. **Resolution**: Flow store resolves references to actual asset data
4. **Rendering**: Asset blocks render the referenced content

### **Cross-Node Asset Discovery**
```javascript
// Helper method for asset selection UI
function getAvailableAssets() {
  const assets = []
  
  // Find all setup nodes
  const setupNodes = nodes.value.filter(n => n.data.nodeType === 'setup')
  
  setupNodes.forEach(setupNode => {
    const setupBlocks = nodeBlocks[setupNode.id] || []
    setupBlocks.forEach(block => {
      if (block.type.startsWith('asset-')) {
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
```

## ✅ Success Criteria

### **Technical**
- ✅ All node types render correctly in Vue Flow
- ✅ Block editing works inline without performance issues
- ✅ History system supports block-level changes
- ✅ Asset references resolve correctly across nodes
- ✅ Document size stays under 1MB for typical flows

### **User Experience** 
- ✅ Drag-and-drop block reordering within nodes
- ✅ Intuitive asset selection from setup nodes
- ✅ Real-time preview of content blocks
- ✅ Smooth transitions and animations
- ✅ Clear visual hierarchy: Flow → Node → Block

### **Architecture**
- ✅ Clean separation between Vue Flow and custom logic
- ✅ Maintainable code structure with single responsibility components
- ✅ Extensible block system for future block types
- ✅ Migration-ready data structure for future scaling

---

**Next Step**: Begin Phase 1 implementation with Start and End nodes, then progressively add Setup → Lecture → Condition nodes. 