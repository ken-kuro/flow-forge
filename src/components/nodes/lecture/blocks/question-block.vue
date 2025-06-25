<script setup>
import { ref, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, HelpCircle } from 'lucide-vue-next';
import InlineEditText from '@/components/shared/inline-edit-text.vue';

/**
 * QuestionBlock - A simplified block for questions in Lecture nodes.
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
   * @type {{id: string, type: string, data: {title: string, question: string}}}
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
const question = ref(props.block.data.question || '');

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    question: question.value,
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
        <HelpCircle class="w-4 h-4 text-info" />
        <InlineEditText
          v-model="title"
          @update:modelValue="updateBlockData(true)"
          placeholder="Enter question block name"
          class="text-sm font-medium"
        />
      </div>
      <button
        @click="handleDelete"
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
        title="Delete Question Block"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Question Text -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Question</span>
      </label>
      <textarea
        v-model="question"
        @blur="updateBlockData()"
        placeholder="What is your question?"
        class="textarea textarea-bordered textarea-xs h-16 resize-none"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 