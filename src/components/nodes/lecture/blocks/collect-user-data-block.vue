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
const collectionTypes = ref(props.block.data.collectionTypes || []);
const prompt = ref(props.block.data.prompt || '');
const variableName = ref(props.block.data.variableName || '');
const showSummary = ref(props.block.data.showSummary !== false); // Default true

// Available collection types
const availableTypes = [
  { value: 'voice', label: 'Voice', icon: '🎤' },
  { value: 'choice', label: 'Choose answer', icon: '✅' },
  { value: 'text', label: 'Text input', icon: '📝' },
];

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    collectionTypes: collectionTypes.value,
    prompt: prompt.value,
    variableName: variableName.value,
    showSummary: showSummary.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
};

// Handle collection type selection
const toggleCollectionType = (type) => {
  const index = collectionTypes.value.indexOf(type);
  if (index > -1) {
    collectionTypes.value.splice(index, 1);
  } else {
    collectionTypes.value.push(type);
  }
  updateBlockData(true);
};

const isTypeSelected = (type) => {
  return collectionTypes.value.includes(type);
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

    <!-- Collection Types -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Collection Methods</span>
      </label>
      <div class="space-y-2">
        <div v-for="type in availableTypes" :key="type.value" class="form-control">
          <label class="label cursor-pointer justify-start gap-2 p-0">
            <input
              type="checkbox"
              :checked="isTypeSelected(type.value)"
              @change="toggleCollectionType(type.value)"
              class="checkbox checkbox-xs checkbox-warning"
            />
            <span class="label-text text-xs">
              {{ type.icon }} {{ type.label }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Prompt -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Prompt</span>
      </label>
      <textarea
        v-model="prompt"
        @blur="updateBlockData()"
        placeholder="Please provide your response..."
        class="textarea textarea-bordered textarea-xs h-16 resize-none"
      ></textarea>
    </div>

    <!-- Variable Name -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Store in Variable</span>
      </label>
      <input
        v-model="variableName"
        @blur="updateBlockData()"
        type="text"
        placeholder="user-response"
        class="input input-bordered input-xs"
      />
    </div>

    <!-- Settings -->
    <div class="form-control">
      <label class="label cursor-pointer justify-start gap-2 p-0">
        <input
          type="checkbox"
          v-model="showSummary"
          @change="updateBlockData(true)"
          class="checkbox checkbox-xs checkbox-warning"
        />
        <span class="label-text text-xs">Show summary after collection</span>
      </label>
    </div>


  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 