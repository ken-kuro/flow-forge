# Flow Forge: Vue Flow Knowledge Base

This document synthesizes our research and establishes the architectural best practices for building the Flow Forge editor with Vue Flow and Pinia.

## 1. Core Architecture: Pinia as the Single Source of Truth

Our architecture is centered on Pinia as the single source of truth. The `<VueFlow>` component is treated as a "dumb" view that renders the state from our Pinia store.

**The Pattern:**
1.  **State in Pinia**: The `nodes` and `edges` arrays reside exclusively in a Pinia store (`flow-store.js`). The store also handles all business logic, such as undo/redo, saving, and applying templates.
2.  **`v-model` Binding**: The `editor-view.vue` component binds the Vue Flow instance directly to the store's state using `v-model:nodes="store.nodes"` and `v-model:edges="store.edges"`.
3.  **One-Way Data Flow**: This binding ensures a clean, one-way data flow.
    *   **UI to State**: User interactions in the Vue Flow canvas (dragging a node, creating a connection) are automatically committed to the Pinia store by Vue Flow.
    *   **State to UI**: Any changes made programmatically in the store (like an undo action or adding a node from a library) are automatically reflected on the canvas.

This approach is simple, robust, and leverages Vue's reactivity system efficiently. We avoid manual event handling (`@nodes-change`, `@connect`) for basic state synchronization, resulting in cleaner component code.

---

## 2. Pinia Store Implementation (`flow-store.js`)

Our store is the heart of the application. It holds the graph state, manages history for undo/redo, and exposes actions to manipulate the flow.

*   **State**: `nodes`, `edges`, a `history` array for undo/redo snapshots.
*   **Actions**: Core methods to manipulate state. Although `v-model` handles basic synchronization, we keep explicit handlers (`onConnect`, etc.) for actions that require additional logic, like saving state to history.

### Reference Implementation:
```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applyChanges } from '@vue-flow/core'

export const useFlowStore = defineStore('flow', () => {
  const nodes = ref([/* initial nodes */]);
  const edges = ref([/* initial edges */]);
  const history = ref([]);
  let historyIndex = -1;

  function saveState() {
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    };
    if (historyIndex < history.value.length - 1) {
      history.value.splice(historyIndex + 1);
    }
    history.value.push(currentState);
    historyIndex = history.value.length - 1;
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      const previousState = history.value[historyIndex];
      nodes.value = JSON.parse(JSON.stringify(previousState.nodes));
      edges.value = JSON.parse(JSON.stringify(previousState.edges));
    }
  }

  function redo() {
    if (historyIndex < history.value.length - 1) {
      historyIndex++;
      const nextState = history.value[historyIndex];
      nodes.value = JSON.parse(JSON.stringify(nextState.nodes));
      edges.value = JSON.parse(JSON.stringify(nextState.edges));
    }
  }

  saveState(); // Save initial state

  function onConnect(connection) {
    edges.value.push(connection);
    saveState();
  }
  
  return {
    nodes,
    edges,
    undo,
    redo,
    saveState,
    onConnect,
  };
});
```

---

## 3. UI Patterns & Interaction Cookbook

| Feature | Implementation Sketch |
|---|---|
| **Palette / Drag & Drop** | Use HTML5 `draggable` on sidebar items. On `@dragstart`, store node metadata. Canvas `@drop` handler uses `instance.project({ x, y })` to get flow coordinates, then calls a Pinia action to `addNode()`. |
| **Custom Nodes** | Create custom Vue components and register them in `<VueFlow :node-types="nodeTypes">`. Wrap components in `markRaw`. Inside, use `<Handle>` for connection points. The node's `data` prop is the primary way to manage its internal content and state. |
| **Inline Editing** | In a custom node, toggle an `editing` flag on click. Show an `<input>` bound with `v-model` directly to `props.data.text`. Use `@blur` or `@keyup.enter` to commit the change (which is already reactive via the store). |
| **Inspector Panel** | A dedicated component that watches a `store.selectedNodeId`. When a node is selected, the inspector binds its UI controls to the `data` of the corresponding node object from the store. |
| **Node Toolbar** | Use the `<NodeToolbar>` component inside a custom node. Position it and control its visibility based on `selected` or `hovered` props. Buttons on the toolbar dispatch actions to the Pinia store (e.g., `store.removeNode(nodeId)`). |
| **Save & Restore** | A "Save" button calls `JSON.stringify({ nodes: store.nodes, edges: store.edges })`. A "Load" button parses the JSON and replaces the state in the store. The UI updates automatically. |
| **Keyboard Shortcuts** | Use a composable like `@vueuse/core`'s `useMagicKeys` to listen for key combinations (e.g., `Ctrl+Z`, `Delete`) and trigger store actions (`undo()`, `removeNode(selectedNodeId)`). |
| **Templates / Sub-flows** | Store reusable groups of nodes/edges in Pinia. An "Apply Template" action deep-copies the template elements, generates new unique IDs for them, and adds them to the main `nodes`/`edges` arrays. |

---

## 4. Advanced Topics

### Connection Validation
Use the `isValidConnection` prop on `<VueFlow>`. Pass it a function that receives a `connection` object and returns `true` or `false`. This is the ideal place to enforce rules:
- Prevent connecting outputs to outputs.
- Block self-connecting nodes.
- Perform a graph traversal (DFS) to detect and prevent creating cyclical dependencies if required.

### Automatic Layouting
For "Tidy Up" functionality, we use a dedicated layouting library.
1.  **Library**: `dagre` is the recommended choice.
2.  **Process**: Create a utility function that takes the current `nodes` and `edges` from the store, builds a `dagre` graph, calculates the layout, and then updates all node positions in the store in a single action.
3.  **Trigger**: This function should be triggered by an explicit user action (e.g., a "Tidy" button), not on every change, to avoid performance issues and jarring UI shifts.

### Performance & Scalability
- **`markRaw`**: Always wrap custom node components in `markRaw` before passing them to `nodeTypes` to prevent Vue from making them reactive.
- **Batch Actions**: When adding multiple elements (e.g., from a template), add them to the store's arrays in a single action to minimize reactive updates.
- **CSS Animations**: Prefer CSS for animations (e.g., `stroke-dasharray` on edges) over JavaScript-based timers for better performance.
- **Virtualization**: For very large graphs (1000+ nodes), consider strategies like only rendering nodes currently in the viewport, though this adds significant complexity. Vue Flow is generally performant for hundreds of nodes out of the box.

---

## 5. Reference Code Snippets

### Editor Component (`editor-view.vue`)
```vue
<script setup>
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { useFlowStore } from '@/stores/flow-store'

const store = useFlowStore()
const { onConnect } = useVueFlow()

// v-model handles node/edge state sync.
// We only need event handlers for specific actions that need extra logic.
onConnect(store.onConnect)
</script>

<template>
  <VueFlow
    v-model:nodes="store.nodes"
    v-model:edges="store.edges"
    class="theme-aware-bg"
    fit-view-on-init
  >
    <!-- Add controls, minimap, background etc. here -->
  </VueFlow>
</template>
```

### Custom Node (`CustomNode.vue`)
```vue
<script setup>
import { ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
  selected: Boolean,
})

// A local ref for inline editing state
const isEditing = ref(false)

// Example of a function that would call a store action
// import { useFlowStore } from '@/stores/flow-store'
// const store = useFlowStore()
// function deleteNode() {
//   store.removeNode(props.id)
// }
</script>

<template>
  <NodeToolbar :is-visible="props.selected" :position="Position.Top">
    <button @click="deleteNode">Delete</button>
  </NodeToolbar>

  <div class="node-card" @dblclick="isEditing = true">
    <div v-if="!isEditing">
      {{ props.data.label }}
    </div>
    <input v-else v-model="props.data.label" @blur="isEditing = false" @keyup.enter="isEditing = false" />
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
``` 