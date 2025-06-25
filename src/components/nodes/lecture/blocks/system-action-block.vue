<script setup>
import { ref, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, Settings } from 'lucide-vue-next';
import InlineEditText from '@/components/shared/inline-edit-text.vue';

/**
 * SystemActionBlock - A simplified block for system actions in Lecture nodes.
 * Matches the design specifications.
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
   * @type {{id: string, type: string, data: {title: string, action: string, value: string}}}
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
const action = ref(props.block.data.action || 'set-variable');
const value = ref(props.block.data.value || '');

// Available actions
const actionOptions = [
  { value: 'set-variable', label: 'Set Variable' },
  { value: 'clear-variable', label: 'Clear Variable' },
  { value: 'api-call', label: 'API Call' },
  { value: 'send-notification', label: 'Send Notification' },
  { value: 'log-event', label: 'Log Event' },
];

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    action: action.value,
    value: value.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
};
</script>

<template>
  <div class="bg-base-100 border border-base-300 rounded-lg p-3 space-y-3 transition-all duration-200 ease-in-out hover:border-base-content/30">
    <!-- Block Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Settings class="w-4 h-4 text-success" />
        <InlineEditText
          v-model="title"
          @update:modelValue="updateBlockData(true)"
          placeholder="Enter system action block name"
          class="text-sm font-medium"
        />
      </div>
      <button
        @click="handleDelete"
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
        title="Delete System Action Block"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Action Type -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Action</span>
      </label>
      <select
        v-model="action"
        @change="updateBlockData(true)"
        class="select select-bordered select-xs"
      >
        <option v-for="option in actionOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Value Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Value</span>
      </label>
      <input
        v-model="value"
        @blur="updateBlockData()"
        type="text"
        placeholder="Enter value"
        class="input input-bordered input-xs"
      />
    </div>
  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 