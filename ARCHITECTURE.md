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

### **Component Structure** ✅ SIMPLIFIED
```
src/components/
├── nodes/
│   ├── base/                       # Foundation components
│   │   ├── card-node-wrapper.vue  # Generic card shell for card-style nodes
│   │   └── block-container.vue    # Core block rendering & management logic
│   ├── shared/                     # Cross-node reusable components
│   │   └── blocks/                # (Future: generic blocks for any node)
│   ├── setup/                      # Setup node & setup-specific blocks
│   │   ├── blocks/
│   │   │   ├── variable-block.vue # ✅ Variable definition blocks
│   │   │   ├── image-asset-block.vue # ✅ Image asset blocks
│   │   │   └── video-asset-block.vue # ✅ Video asset blocks
│   │   └── setup-node.vue         # ✅ Asset & variable management node
│   ├── start-node.vue             # ✅ Simple welcome/start node
│   ├── end-node.vue               # ✅ Simple termination node
│   ├── index.js                   # ✅ ONLY exports nodeTypes registry
│   └── (future directories)
│       ├── lecture/               # 🚧 Next: lecture-specific components
│       └── condition/             # 🚧 Future: condition-specific components
└── editor/
    └── toolbar.vue                # ✅ Node creation toolbar
```

#### **Architectural Benefits**
- **No Barrel Exports**: Eliminates complexity and improves tree shaking
- **Clear File Paths**: Every import shows exactly where the component lives
- **Scalable Organization**: Easy to add new node types without conflicts
- **Direct Dependencies**: Easy to see what each component needs
- **Maintainability**: Related code is co-located by feature/domain

#### **Import Patterns** ✅ DIRECT ONLY
```javascript
// ✅ Only registry export (for Vue Flow registration)
import { nodeTypes } from '@/components/nodes';

// ✅ All other imports are direct file paths
import StartNode from '@/components/nodes/start-node.vue';
import EndNode from '@/components/nodes/end-node.vue';
import SetupNode from '@/components/nodes/setup/setup-node.vue';
import CardNodeWrapper from '@/components/nodes/base/card-node-wrapper.vue';
import BlockContainer from '@/components/nodes/base/block-container.vue';

// ✅ Internal components (when needed)
import VariableBlock from '@/components/nodes/setup/blocks/variable-block.vue';

// ✅ Future shared components (direct imports)
import BlockToolbar from '@/components/nodes/shared/block-toolbar.vue';
```

#### **Why Direct Imports Only?**
- **Maximum Tree Shaking**: Bundlers can eliminate unused code perfectly
- **Zero Abstraction**: What you import is exactly what you get
- **Fastest IDE Performance**: No barrel file resolution needed
- **Smallest Bundles**: No accidental imports of unused components
- **Perfect Encapsulation**: Block components are clearly internal

#### **Component Architecture Principles**

**Base Components (Pure UI Containers):**
- **`CardNodeWrapper`**: Generic card shell with consistent styling
- **`BlockContainer`**: Pure container for linear block stacking
- **No Business Logic**: Only provide UI structure and styling
- **Slot-Based**: Accept content through slots for maximum flexibility

**Node Components (Domain-Specific Logic):**
- **Own Their Blocks**: Each node manages its specific block types
- **Import Block Components**: Direct imports of their required block types
- **Handle Block Logic**: Create, update, delete operations for their blocks
- **Provide Management UI**: Custom dropdowns and actions for their use case

**Block Components (Leaf Components):**
- **Props**: `nodeId` (string), `block` (object with id, type, data)
- **Composition**: Uses `useFlowEditor()` for store operations
- **UI Pattern**: Header with icon/title/delete, form fields, preview area
- **State Management**: Local reactive refs synced to store on blur/change
- **Styling**: DaisyUI classes with hover transitions and semantic colors

This architecture ensures:
- **Perfect Encapsulation**: Setup nodes can't accidentally import Lecture blocks
- **Clean Separation**: UI containers vs business logic vs data components
- **Reusability**: Base components work for any node type
- **Maintainability**: Each concern is in the right place

## 🔧 Implementation Plan

### **Phase 1: Foundation (Week 1)** ✅ COMPLETED
1. ✅ **Update Data Structure**: Enhance flow store for nodeBlocks
2. ✅ **Basic Node Registration**: Register custom node types with Vue Flow
3. ✅ **Simple Nodes First**: Implement Start and End nodes (no blocks)

### **Phase 2: Setup Node (Week 2)** ✅ COMPLETED
1. ✅ **Setup Node Component**: Basic container with block support
2. ✅ **Asset Blocks**: Image and Video asset blocks with preview functionality
3. ✅ **Variable Blocks**: Typed variable definitions (string, number, boolean)
4. ✅ **Block Management**: Add/remove/edit blocks with dropdown interface
5. ✅ **Asset ID System**: Unique IDs for cross-referencing

#### **Implemented Block Types**
- **Variable Block** (`variable`): Define typed variables with name, value, and type selection
- **Image Asset Block** (`imageAsset`): Image resources with URL, title, alt text, and preview
- **Video Asset Block** (`videoAsset`): Video resources with URL, title, duration, thumbnail, and preview

#### **Block Management Features**
- **Dropdown Interface**: Clean UI for selecting block types to add
- **Inline Editing**: Direct editing of block properties with auto-save on blur
- **Type Safety**: Proper type conversion for variable blocks (string/number/boolean)
- **Delete Functionality**: Individual block deletion with confirmation
- **Preview System**: Live preview of images and video thumbnails
- **Consistent Styling**: DaisyUI-based theming with hover states and transitions

### **Phase 3: Condition Node (Week 3)** `▶️ In Progress`
1. **Condition Logic**: Implement a `custom-condition` node type.
2. **Branching UI**: Allow adding, editing, and removing condition branches within the node.
3. **Nested Nodes**: Use Vue Flow's parent/child feature to render `condition-branch` nodes inside the condition node. Each branch must have its own source handle.
4. **Edge Management**: Ensure edges correctly connect from branches to subsequent nodes.
5. **Data Structure**: Define how conditions are stored (e.g., simple expression or structured object).

### **Phase 4: Lecture Node (Week 4-5)**
1. **Lecture Node Component**: Create a `custom-lecture` node that uses the `BlockContainer` for its content.
2. **Content Blocks**: Implement various content delivery blocks (e.g., "Teacher Video", "Question").
3. **Reference Blocks**: Implement the "Assets Applied" block to reference items from `Setup Nodes`.
4. **Action Blocks**: Implement blocks for system actions like "Collect Answer".
5. **Inline Editing**: Ensure all block properties are editable directly within the node UI.

### **Phase 5: Polish & Testing (Week 6)**
1. **UI Polish**: Consistent styling across all node/block types.
2. **Performance**: Optimize rendering for flows with many blocks
3. **Error Handling**: Validation and error boundaries
4. **Documentation**: Component and API documentation

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
  
  for (const setupNode of setupNodes) {
    const setupBlocks = nodeBlocks[setupNode.id] || []
    for (const block of setupBlocks) {
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
    }
  }
  
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

### 🏛️ **State Management & Interaction Patterns**

To ensure a clean, maintainable, and scalable codebase, we adhere to a strict three-layer architecture pattern, inspired by Model-View-Controller (MVC).

#### **1. The Three Layers**
- **The Model (`/src/stores/flow-store.js`):** The "Brain." This is our Pinia store and the single source of truth for all application state (`nodes`, `edges`, `nodeBlocks`, `history`). It must be UI-agnostic and should not contain any Vue Flow-specific logic other than the pure `applyChanges` helper. It exposes functions for managing our application's *custom* data, like block manipulations.
- **The Controller (`/src/composables/use-flow-editor.js`):** The "Orchestrator." This is the central hub for all application logic. It is the **only file** in the application that should import and use the `useVueFlow()` hook. It connects the View and the Model, listening for user events and calling actions on either the store or the Vue Flow library.
- **The View (`/src/components/**/*.vue`):** The "Face." This layer is considered "dumb" and is only responsible for displaying state and emitting user intent to the Controller. All actions (e.g., button clicks) must call a function exposed by `useFlowEditor`.

#### **2. Unidirectional Data Flow ("Actions Up, State Down")**
We enforce a strict one-way data flow to ensure predictability and ease of debugging.
- **Actions Flow UP:** A user interacts with the `View`, which calls an action on the `Controller`. The `Controller` then executes logic, which may update the `Model`.
- **State Flows DOWN:** The `Model`'s state is mutated. Vue's reactivity system then automatically updates the `View` to reflect the new state.

#### **3. Vue Flow Interaction Strategy**
- **State Sync via `v-model`:** For our current needs, we use `v-model:nodes` and `v-model:edges` for simple and declarative state synchronization. We have a `TODO` in the store to revisit this and switch to a fully controlled pattern if future features (like confirmation dialogs) require it.
- **Communicate Intent with Library Actions:** To initiate a change like adding or removing a node, the `Controller` **must** use the library's provided actions (e.g., `addNodes`, `removeNodes`). This ensures Vue Flow emits clean, semantic events.
- **Listen to Events for Custom Logic:** We use event handlers like `onNodesChange` for the sole purpose of triggering our own custom logic that the library is unaware of—primarily, to call `saveState()` and manage our undo/redo history stack.

---

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
}