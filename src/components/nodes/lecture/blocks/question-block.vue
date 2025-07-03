<script setup>
import { ref, onUnmounted, watch } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { HelpCircle } from 'lucide-vue-next';
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue';

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

const { updateBlock, flushPendingSaves } = useFlowEditor();

// Flush any pending saves when component is unmounted
onUnmounted(() => {
  flushPendingSaves();
});

// Local reactive copies for editing
const title = ref(props.block.data.title || '');
const questionId = ref(props.block.data.questionId || '');

// Watch for title changes and update block data immediately
watch(title, () => {
  updateBlockDataImmediate();
});

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    questionId: questionId.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

// Handle title updates from the wrapper
const handleTitleUpdate = (newTitle) => {
  title.value = newTitle;
  updateBlockData(true);
};

// Update the store immediately
const updateBlockDataImmediate = () => {
  updateBlockData(true);
};
</script>

<template>
  <CardBlockWrapper
    v-model="title"
    :icon="HelpCircle"
    icon-color="text-info"
    :node-id="nodeId"
    :block-id="block.id"
    placeholder="Enter question block name"
  >
    <!-- Question ID -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Question ID</span>
      </label>
      <input
        v-model="questionId"
        @blur="updateBlockData()"
        type="text"
        placeholder="Enter question ID"
        class="input input-bordered input-xs"
      />
    </div>
  </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style> 