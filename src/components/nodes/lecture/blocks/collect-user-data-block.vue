<script setup>
import { ref, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, Database } from 'lucide-vue-next';
import InlineEditText from '@/components/shared/inline-edit-text.vue';

/**
 * CollectUserDataBlock - A block for collecting user data in Lecture nodes.
 * Allows configuration of data collection methods and options.
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
   * @type {{id: string, type: string, data: {title: string, collectionTypes: string[], prompt: string, variableName: string, showSummary: boolean}}}
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
const title = ref(props.block.data.title || '');
const methods = ref(props.block.data.methods || []);
const saveToField = ref(props.block.data.saveToField || '');

// Available collection methods (multiple choice)
const availableMethods = [
  { value: 'voice', label: 'Voice' },
  { value: 'choose-answer', label: 'Choose Answer' },
  { value: 'text-input', label: 'Text Input' },
];

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    methods: methods.value,
    saveToField: saveToField.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
};

// Handle method selection (multiple choice)
const toggleMethod = (method) => {
  const index = methods.value.indexOf(method);
  if (index > -1) {
    methods.value.splice(index, 1);
  } else {
    methods.value.push(method);
  }
  updateBlockData(true);
};

const isMethodSelected = (method) => {
  return methods.value.includes(method);
};
</script>

<template>
  <div class="bg-base-100 border border-base-300 rounded-lg p-3 space-y-3 transition-all duration-200 ease-in-out hover:border-base-content/30">
    <!-- Block Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Database class="w-4 h-4 text-warning" />
        <InlineEditText
          v-model="title"
          @update:modelValue="updateBlockData(true)"
          placeholder="Enter collect user data block name"
          class="text-sm font-medium"
        />
      </div>
      <button
        @click="handleDelete"
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
        title="Delete Collect User Data Block"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Method Selection (Multiple Choice) -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Method</span>
      </label>
      <div class="dropdown w-full">
        <div tabindex="0" role="button" class="select select-bordered select-xs w-full flex items-center cursor-pointer">
          <span v-if="methods.length === 0" class="text-base-content/50">Select methods...</span>
          <span v-else class="text-left">{{ methods.map(m => availableMethods.find(am => am.value === m)?.label || m).join(', ') }}</span>
        </div>
        <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300 mt-1">
          <li v-for="method in availableMethods" :key="method.value">
            <label class="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded">
              <input
                type="checkbox"
                :checked="isMethodSelected(method.value)"
                @change="toggleMethod(method.value)"
                class="checkbox checkbox-xs checkbox-warning"
              />
              <span class="label-text text-xs">{{ method.label }}</span>
            </label>
          </li>
        </ul>
      </div>
    </div>

    <!-- Save To Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Save to</span>
      </label>
      <input
        v-model="saveToField"
        @blur="updateBlockData()"
        type="text"
        placeholder="TODO: Variable reference system"
        class="input input-bordered input-xs"
      />
      <!-- TODO: Implement variable reference similar to assets reference in asset applied block -->
    </div>


  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 