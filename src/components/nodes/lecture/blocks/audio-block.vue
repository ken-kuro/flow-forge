<script setup>
import { ref, onUnmounted, watch } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { Volume2 as AudioIcon } from 'lucide-vue-next';
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue';

/**
 * AudioBlock - A simplified block for creating audio blocks.
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
   * @type {{id: string, type: string, data: {title: string, description: string, voice: string, text: string}}}
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
const title = ref(props.block.data.title || 'Audio');
const description = ref(props.block.data.description || '');
const voice = ref(props.block.data.voice || 'male');
const text = ref(props.block.data.text || '');

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    description: description.value,
    voice: voice.value,
    text: text.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

// Watch for title changes (debounced)
watch(title, () => {
  updateBlockData();
});

</script> 

<template>
  <CardBlockWrapper
    v-model="title"
    :icon="AudioIcon"
    icon-color="text-primary"
    :node-id="nodeId"
    :block-id="block.id"
    placeholder="Enter audio block name"
  >
     <!-- Description Field -->
     <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Description</span>
      </label>
      <textarea
        v-model="description"
        @blur="updateBlockData"
        @wheel.stop
        @mousedown.stop
        @mouseup.stop
        @click.stop
        placeholder="Enter video description"
        class="textarea textarea-bordered textarea-xs min-h-18"
      ></textarea>
    </div>

    <!-- Voice Selection -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Select Voice</span>
      </label>
      <div class="flex gap-4">
        <label class="label cursor-pointer justify-start gap-2">
          <input
            type="radio"
            v-model="voice"
            value="male"
            @change="updateBlockData(true)"
            class="radio radio-xs radio-primary"
          />
          <span class="label-text text-xs">Male</span>
        </label>
        <label class="label cursor-pointer justify-start gap-2">
          <input
            type="radio"
            v-model="voice"
            value="female"
            @change="updateBlockData(true)"
            class="radio radio-xs radio-primary"
          />
          <span class="label-text text-xs">Female</span>
        </label>
      </div>
    </div>

    <!-- Text to Speech -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Audio text to speech</span>
      </label>
      <textarea
        v-model="text"
        @blur="updateBlockData"
        @wheel.stop
        @mousedown.stop
        @mouseup.stop
        @click.stop
        placeholder="Enter the text to be read"
        class="textarea textarea-bordered textarea-xs min-h-18"
      ></textarea>
    </div>
  </CardBlockWrapper>
</template>