<script setup>
import { ref, onUnmounted, computed } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { Play, Upload, X } from 'lucide-vue-next';
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue';

/**
 * TeacherVideoBlock - A block for displaying video content in Lecture nodes.
 * Simplified to match the design specifications.
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
   * @type {{id: string, type: string, data: {title: string, videoUrl: string, sourceType: 'url'|'upload', transcript: string}}}
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
const title = computed({
  get: () => props.block.data.title ?? '',
  set: (val) => {
    props.block.data.title = val;
    updateBlockData();
  }
});
const description = ref(props.block.data.description ?? '');
const videoUrl = ref(props.block.data.videoUrl ?? '');
const sourceType = ref(props.block.data.sourceType ?? 'url');
const transcript = ref(props.block.data.transcript ?? '');

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    description: description.value,
    sourceType: sourceType.value,
    videoUrl: videoUrl.value,
    transcript: transcript.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

const handleAddVideo = () => {
  // TODO: Implement proper video upload functionality
  alert('Video upload functionality is not implemented yet.');
  // For now, let's set a placeholder to simulate a successful "upload"
  videoUrl.value = 'https://www.w3schools.com/html/mov_bbb.mp4';
  updateBlockData(true);
};

const handleSourceTypeChange = () => {
  videoUrl.value = '';
  updateBlockData(true);
};

const removeVideo = () => {
  videoUrl.value = '';
  updateBlockData(true);
};
</script>

<template>
  <CardBlockWrapper
    v-model="title"
    :icon="Play"
    icon-color="text-secondary"
    :node-id="nodeId"
    :block-id="block.id"
    placeholder="Enter teacher video block name"
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
        class="textarea textarea-bordered textarea-xs min-h-18 "
      ></textarea>
    </div>

    <!-- Source Type Selection -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Source</span>
      </label>
      <select
        v-model="sourceType"
        @change="handleSourceTypeChange"
        class="select select-bordered select-xs"
      >
        <option value="url">From URL</option>
        <option value="upload">Upload Video</option>
      </select>
    </div>

    <!-- URL Input or Upload Button -->
    <div class="form-control">
      <div v-if="sourceType === 'url'">
        <label class="label">
          <span class="label-text text-xs">Video URL</span>
        </label>
        <input
          v-model="videoUrl"
          @blur="updateBlockData"
          type="url"
          placeholder="https://example.com/video.mp4"
          class="input input-bordered input-xs"
        />
      </div>
      <div v-if="sourceType === 'upload' && !videoUrl">
        <label class="label">
           <span class="label-text text-xs">File</span>
        </label>
        <button @click="handleAddVideo" class="btn btn-sm btn-outline btn-secondary w-full">
          <Upload class="w-3 h-3 mr-2" />
          <span>Add Video (max 15mb)</span>
        </button>
      </div>
    </div>

    <!-- Video Preview -->
    <div v-if="videoUrl" class="preview-container">
      <label class="label">
        <span class="label-text text-xs">Preview</span>
      </label>
      <div class="w-full h-32 bg-base-200 rounded flex items-center justify-center overflow-hidden relative">
        <video
          :src="videoUrl"
          controls
          class="max-w-full max-h-full"
          preload="metadata"
        ></video>
        <!-- Remove button on preview -->
        <div class="absolute top-1 right-1">
          <button @click="removeVideo" class="btn btn-xs btn-circle btn-error">
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Transcript Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Transcript</span>
      </label>
      <textarea
        v-model="transcript"
        @blur="updateBlockData"
        @wheel.stop
        @mousedown.stop
        @mouseup.stop
        @click.stop
        placeholder="Enter video transcript"
        class="textarea textarea-bordered textarea-xs min-h-18 "
      ></textarea>
    </div>
  </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>