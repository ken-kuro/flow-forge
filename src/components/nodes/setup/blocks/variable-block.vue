<script setup>
// TODO: Revisit this component. The current implementation is a placeholder for handling variables.
import { ref, computed, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, Variable } from 'lucide-vue-next';

/**
 * VariableBlock - A block for defining variables in Setup nodes.
 * Allows editing of variable name, value, and type.
 */
const props = defineProps({
  /**
   * The node ID this block belongs to.
   */
  nodeId: {
    type: String,
    required: true,
  },
  /**
   * The block data object.
   * @type {{id: string, type: string, data: {name: string, value: any, type: 'string'|'number'|'boolean'}}}
   */
  block: {
    type: Object,
    required: true,
  },
});

const { updateBlock, removeBlock, flushPendingSaves } = useFlowEditor();

// Flush any pending saves when component is unmounted
onUnmounted(() => {
  flushPendingSaves();
});

// Local reactive copies for editing
const name = ref(props.block.data.name || '');
const value = ref(props.block.data.value || '');
const variableType = ref(props.block.data.type || 'string');

// Variable type options
const typeOptions = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
];

// Update the store when values change (debounced)
const updateBlockData = () => {
  let processedValue = value.value;
  
  // Convert value based on type
  if (variableType.value === 'number') {
    processedValue = Number(value.value) || 0;
  } else if (variableType.value === 'boolean') {
    processedValue = value.value === 'true' || value.value === true;
  }

  const newData = {
    name: name.value,
    value: processedValue,
    type: variableType.value,
  };
  updateBlock(props.nodeId, props.block.id, newData); // Debounced save
};

// Update the store immediately (for important changes like type)
const updateBlockDataImmediate = () => {
  let processedValue = value.value;
  
  // Convert value based on type
  if (variableType.value === 'number') {
    processedValue = Number(value.value) || 0;
  } else if (variableType.value === 'boolean') {
    processedValue = value.value === 'true' || value.value === true;
  }

  const newData = {
    name: name.value,
    value: processedValue,
    type: variableType.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, true); // Immediate save
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
};

// Handle type change - convert value appropriately
const handleTypeChange = () => {
  if (variableType.value === 'boolean') {
    value.value = 'false';
  } else if (variableType.value === 'number') {
    value.value = Number(value.value) || 0;
  }
  updateBlockDataImmediate(); // Save immediately for type changes
};

// Preview the processed value
const processedValue = computed(() => {
  if (variableType.value === 'number') {
    return Number(value.value) || 0;
  } else if (variableType.value === 'boolean') {
    return value.value === 'true' || value.value === true;
  }
  return value.value;
});
</script>

<template>
  <div class="variable-block bg-base-100 border border-base-300 rounded-lg p-3 space-y-3">
    <!-- Block Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Variable class="w-4 h-4 text-accent" />
        <span class="text-sm font-medium">Variable</span>
      </div>
      <button 
        @click="handleDelete" 
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
        title="Delete Variable"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Variable Name Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Variable Name</span>
      </label>
      <input 
        v-model="name"
        @blur="updateBlockData"
        type="text" 
        placeholder="e.g., userName"
        class="input input-bordered input-xs"
      />
    </div>

    <!-- Type and Value Fields -->
    <div class="grid grid-cols-1 gap-2">
      <!-- Type Selection -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Type</span>
        </label>
        <select 
          v-model="variableType"
          @change="handleTypeChange"
          class="select select-bordered select-xs"
        >
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Value Field -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Value</span>
        </label>
        
        <!-- String input -->
        <input 
          v-if="variableType === 'string'"
          v-model="value"
          @blur="updateBlockData"
          type="text" 
          placeholder="Enter text value"
          class="input input-bordered input-xs"
        />
        
        <!-- Number input -->
        <input 
          v-else-if="variableType === 'number'"
          v-model="value"
          @blur="updateBlockData"
          type="number" 
          placeholder="0"
          class="input input-bordered input-xs"
        />
        
        <!-- Boolean select -->
        <select 
          v-else-if="variableType === 'boolean'"
          v-model="value"
          @change="updateBlockData"
          class="select select-bordered select-xs"
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      </div>
    </div>

    <!-- Value Preview -->
    <div v-if="name" class="preview-container">
      <div class="label">
        <span class="label-text text-xs">Preview</span>
      </div>
      <div class="bg-base-200 rounded p-2 text-xs font-mono">
        <span class="text-accent">{{ name }}</span> = 
        <span class="text-primary">{{ processedValue }}</span>
        <span class="text-base-content/50 ml-2">({{ variableType }})</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.variable-block {
  transition: all 0.2s ease;
}

.variable-block:hover {
  border-color: hsl(var(--bc) / 0.3);
}
</style> 