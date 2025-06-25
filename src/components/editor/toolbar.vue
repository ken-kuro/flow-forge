<script setup>
import { useFlowEditor } from "@/composables/use-flow-editor";
import { Plus, History, Undo, Redo, Download, Upload, Bug } from "lucide-vue-next";
import { useMagicKeys } from "@vueuse/core";
import { ref, computed } from "vue";

/**
 * EditorToolbar - Simplified application toolbar for the flow editor
 * 
 * This component provides essential features:
 * - Create new nodes
 * - History management (undo/redo/history) with keyboard shortcuts
 * - File operations (import/export)
 * 
 * Uses the useFlowEditor composable for all flow operations,
 * following Vue 3 composition patterns and best practices.
 */

// --- Flow Editor API ---
const {
  nodes,
  edges,
  nodeBlocks,
  importFlow,
  exportFlow,
  undo,
  redo,
  canUndo,
  canRedo,
  history,
  historyIndex,
  clearHistory,
  createNode,
} = useFlowEditor();

// Ref for the create button to programmatically open the dropdown
const createButtonRef = ref(null);

// --- Keyboard Shortcuts ---
// Using useMagicKeys with onEventFired for more precise control
// This prevents multiple triggers from key repeat or event phases

// Track the last action time to prevent duplicate executions
let lastUndoTime = 0;
let lastRedoTime = 0;
const DEBOUNCE_DELAY = 100; // 100ms debounce

const { ctrl_z, ctrl_y, ctrl_shift_z, cmd_z, cmd_y, cmd_shift_z } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    const now = Date.now();
    
    // Only handle keydown events to avoid duplicates
    if (e.type !== 'keydown') return;
    
    // Undo: Ctrl+Z or Cmd+Z (but not Ctrl+Shift+Z)
    if (((e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) || (e.metaKey && e.key.toLowerCase() === 'z' && !e.shiftKey)) 
        && canUndo.value && (now - lastUndoTime) > DEBOUNCE_DELAY) {
      e.preventDefault();
      e.stopPropagation();
      lastUndoTime = now;
      undo();
      return;
    }
    
    // Redo: Ctrl+Y, Ctrl+Shift+Z, Cmd+Y, or Cmd+Shift+Z
    if (((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') || 
         (e.metaKey && e.key.toLowerCase() === 'y') || (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'z'))
        && canRedo.value && (now - lastRedoTime) > DEBOUNCE_DELAY) {
      e.preventDefault();
      e.stopPropagation();
      lastRedoTime = now;
      redo();
      return;
    }
  },
});

// Keyboard shortcut for creating a new node
const { ctrl_alt_n, cmd_option_n } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      e.stopPropagation();
      // Focus the button to open the dropdown menu
      createButtonRef.value?.focus();
    }
  },
});

// History state
const historyRef = ref(null)

// History navigation functions
const jumpToHistoryState = (targetIndex) => {
  const currentIndex = historyIndex.value
  
  if (targetIndex === currentIndex) return
  
  // Jump directly to the target state
  if (targetIndex < currentIndex) {
    // Go backwards
    const steps = currentIndex - targetIndex
    for (let i = 0; i < steps; i++) {
      undo()
    }
  } else {
    // Go forwards
    const steps = targetIndex - currentIndex
    for (let i = 0; i < steps; i++) {
      redo()
    }
  }
}

// Node operations
const handleCreateNodeByType = (type) => {
  // TODO: Add a more robust system for positioning new nodes
  const position = {
    x: Math.random() * 400 + 100,
    y: Math.random() * 300 + 100
  }

  let nodeData;

  // Set default data based on node type
  switch (type) {
    case 'custom-end':
      nodeData = { type, position, data: { } };
      break;
    case 'custom-setup':
      nodeData = { type, position, data: { } };
      break;
    case 'custom-lecture':
      nodeData = { type, position, data: { } };
      break;
    case 'custom-condition':
      nodeData = { type, position, data: { } };
      break;
    // Add cases for future node types like 'lecture' or 'setup'
    // case 'lecture':
    default:
      console.warn(`Unknown node type: ${type}`);
      return;
  }

  createNode(nodeData);

  // Close the dropdown after creating the node
  if (document.activeElement) {
    document.activeElement.blur();
  }
};

// File operations
const handleImport = () => {
  // Create a file input element
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const flowData = JSON.parse(e.target.result);
        
        // Show confirmation dialog if current flow has content
        const hasContent = nodes.value.length > 2 || Object.keys(nodeBlocks.value).length > 0;
        
        if (hasContent) {
          const confirmed = confirm(
            `Import "${flowData.name || 'Untitled Flow'}"?\n\n` +
            'This will replace your current flow. Make sure to export your current work first if you want to keep it.'
          );
          
          if (!confirmed) return;
        }
        
        // Attempt to import the flow
        const success = importFlow(flowData);
        
        if (success) {
          alert(`✅ Flow "${flowData.name || 'Untitled'}" imported successfully!`);
        } else {
          alert('❌ Failed to import flow. Please check the file format and try again.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('❌ Invalid JSON file. Please select a valid Flow Forge export file.');
      }
    };
    
    reader.onerror = () => {
      alert('❌ Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
  };
  
  // Trigger file dialog
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
};

const handleExport = () => {
  // Show a simple prompt for flow name and description
  const flowName = prompt('Enter a name for your flow:', 'My Learning Flow') || 'Untitled Flow';
  if (flowName === null) return; // User cancelled
  
  const flowDescription = prompt('Enter a description (optional):', 'Created with Flow Forge') || 'Created with Flow Forge';
  
  try {
    // Export the flow data
    const flowData = exportFlow({
      name: flowName,
      description: flowDescription
    });
    
    // Create and download the JSON file
    const jsonString = JSON.stringify(flowData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link with smart filename generation
    const sanitizedName = flowName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = sanitizedName.includes('flow') 
      ? `${sanitizedName}.json` 
      : `${sanitizedName}_flow.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    // Show success message
    alert(`✅ Flow "${flowName}" exported successfully!`);
    
  } catch (error) {
    console.error('Export error:', error);
    alert('❌ Error exporting flow. Please try again.');
  }
};

const handleDebugDump = () => {
  console.group("🔬 Flow Forge Debug Dump");
  console.log("Nodes:", JSON.parse(JSON.stringify(nodes.value)));
  console.log("Edges:", JSON.parse(JSON.stringify(edges.value)));
  console.log("Node Blocks:", JSON.parse(JSON.stringify(nodeBlocks.value)));
  console.log("History Stack:", JSON.parse(JSON.stringify(history.value)));
  console.log("Current History Index:", historyIndex.value);
  console.groupEnd();
  alert("Current flow state has been logged to the console.");
};
</script>

<template>
  <div class="app-toolbar absolute top-4 right-4 z-50">
    <div class="flex items-center gap-2 bg-base-100 rounded-lg shadow-lg border border-base-300 p-2">
      <!-- Create Group -->
      <div class="dropdown dropdown-bottom dropdown-end">
        <div
          ref="createButtonRef"
          tabindex="0"
          role="button"
          class="btn btn-primary btn-sm"
          title="Create Node (Ctrl+Alt+N)"
        >
          <Plus class="w-4 h-4" />
        </div>
        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><a @click="() => handleCreateNodeByType('custom-setup')">Setup Node</a></li>
          <li><a @click="() => handleCreateNodeByType('custom-lecture')">Lecture Node</a></li>
          <li><a @click="() => handleCreateNodeByType('custom-condition')">Condition Node</a></li>
          <li><a @click="() => handleCreateNodeByType('custom-end')">End Node</a></li>
          <!-- Future node types will be added here -->
        </ul>
      </div>

      <!-- History Group -->
      <div class="flex items-center gap-1 border-l border-base-300 ml-2 pl-2">
        <button
          @click="undo"
          :disabled="!canUndo"
          class="btn btn-ghost btn-sm"
          title="Undo (Ctrl+Z)"
        >
          <Undo class="w-4 h-4" />
        </button>
        <button
          @click="redo"
          :disabled="!canRedo"
          class="btn btn-ghost btn-sm"
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <Redo class="w-4 h-4" />
        </button>
        <div class="dropdown dropdown-bottom dropdown-end" ref="historyRef">
          <button
            tabindex="0"
            role="button"
            class="btn btn-ghost btn-sm"
            title="History Timeline"
          >
            <History class="w-4 h-4" />
          </button>
          
          <!-- History Timeline Dropdown -->
          <div tabindex="0" class="dropdown-content z-[1] menu p-4 shadow bg-base-100 rounded-box w-80 border border-base-300">
            <div class="mb-3">
              <h3 class="font-semibold text-sm text-base-content">History Timeline</h3>
              <p class="text-xs text-base-content/70">Current: {{ historyIndex + 1 }} / {{ history.length }}</p>
            </div>
            
            <div class="max-h-60 overflow-y-auto">
              <div v-if="history.length === 0" class="text-xs text-base-content/50 text-center py-4">
                No history available
              </div>
              
              <div v-else class="space-y-2">
                <div 
                  v-for="(state, index) in history" 
                  :key="index"
                  @click="jumpToHistoryState(index)"
                  :class="[
                    'flex items-center gap-2 p-2 rounded cursor-pointer text-xs',
                    index === historyIndex 
                      ? 'bg-primary text-primary-content' 
                      : 'hover:bg-base-200 text-base-content'
                  ]"
                >
                  <div class="w-2 h-2 rounded-full bg-current opacity-50"></div>
                  <div class="flex-1">
                    <div class="font-medium">
                      {{ state.description || `State ${index + 1}` }}
                    </div>
                    <div class="opacity-70">
                      {{ state.nodes.length }} nodes, {{ state.edges.length }} edges
                    </div>
                  </div>
                  <div v-if="index === historyIndex" class="text-xs opacity-70">
                    Current
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-3 pt-3 border-t border-base-300 flex gap-2">
              <button 
                @click="() => { clearHistory(); }" 
                class="btn btn-ghost btn-xs flex-1"
                :disabled="history.length <= 1"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Import/Export Group -->
      <div class="flex items-center gap-1 border-l border-base-300 ml-2 pl-2">
        <button
          @click="handleImport"
          class="btn btn-ghost btn-sm"
          title="Import from JSON"
        >
          <Upload class="w-4 h-4" />
        </button>
        <button
          @click="handleExport"
          class="btn btn-ghost btn-sm"
          title="Export as JSON"
        >
          <Download class="w-4 h-4" />
        </button>
      </div>

      <!-- Debug Group -->
      <div class="flex items-center gap-1 border-l border-base-300 ml-2 pl-2">
        <button
          @click="handleDebugDump"
          class="btn btn-ghost btn-sm text-accent"
          title="Dump State to Console"
        >
          <Bug class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-toolbar {
  user-select: none;
  animation: slideInFromRight 0.3s ease-out;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  transition: transform 0.1s ease;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style> 