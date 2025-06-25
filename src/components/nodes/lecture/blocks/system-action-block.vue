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
const action = ref(props.block.data.action || 'asset-interaction');
const delay = ref(props.block.data.delay || '');
const methods = ref(props.block.data.methods || []);
const object = ref(props.block.data.object || '');

// Available actions (extensible for future API calls, jobs, etc.)
const actionOptions = [
  { value: 'asset-interaction', label: 'Asset Interaction' },
  // Future: api-call, do-job, etc.
];

// Available methods for asset interaction (multiple choice)
const availableMethods = [
  { value: 'circle', label: 'Circle' },
  { value: 'score', label: 'Score' },
];

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    action: action.value,
    delay: delay.value,
    methods: methods.value,
    object: object.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
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

    <!-- Asset Interaction Fields (show only when action is asset-interaction) -->
    <div v-if="action === 'asset-interaction'" class="space-y-3">
      <!-- Delay Field -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Delay (in seconds)</span>
        </label>
        <input
          v-model="delay"
          @blur="updateBlockData()"
          type="text"
          placeholder="e.g., 2.5"
          class="input input-bordered input-xs"
        />
      </div>

      <!-- Method Selection (Multiple Choice) -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Method view</span>
        </label>
        <div class="dropdown w-full">
          <div tabindex="0" role="button" class="select select-bordered select-xs w-full flex items-center cursor-pointer">
            <span v-if="methods.length === 0" class="text-base-content/50">Select view methods...</span>
            <span v-else class="text-left">{{ methods.map(m => availableMethods.find(am => am.value === m)?.label || m).join(', ') }}</span>
          </div>
          <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300 mt-1">
            <li v-for="method in availableMethods" :key="method.value">
              <label class="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded">
                <input
                  type="checkbox"
                  :checked="isMethodSelected(method.value)"
                  @change="toggleMethod(method.value)"
                  class="checkbox checkbox-xs checkbox-success"
                />
                <span class="label-text text-xs">{{ method.label }}</span>
              </label>
            </li>
          </ul>
        </div>
      </div>

      <!-- Object Field -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Object</span>
        </label>
        <input
          v-model="object"
          @blur="updateBlockData()"
          type="text"
          placeholder="TODO: Object reference system"
          class="input input-bordered input-xs"
        />
        <!-- TODO: Implement object reference similar to variable reference system -->
      </div>
    </div>
  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 