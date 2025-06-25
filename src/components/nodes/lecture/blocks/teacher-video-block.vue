<script setup>
import { ref, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, Play, Upload } from 'lucide-vue-next';
import InlineEditText from '@/components/shared/inline-edit-text.vue';

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

const { updateBlock, removeBlock, flushPendingSaves } = useFlowEditor();

// Flush any pending saves when component is unmounted
onUnmounted(() => {
  flushPendingSaves();
});

// Local reactive copies for editing
const title = ref(props.block.data.title || '');
const videoUrl = ref(props.block.data.videoUrl || '');
const sourceType = ref(props.block.data.sourceType || 'url');
const transcript = ref(props.block.data.transcript || '');

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    videoUrl: videoUrl.value,
    sourceType: sourceType.value,
    transcript: transcript.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
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
</script>

<template>
  <div class="bg-base-100 border border-base-300 rounded-lg p-3 space-y-3 transition-all duration-200 ease-in-out hover:border-base-content/30">
    <!-- Block Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Play class="w-4 h-4 text-accent" />
        <InlineEditText
          v-model="title"
          @update:modelValue="updateBlockData(true)"
          placeholder="Enter teacher video block name"
          class="text-sm font-medium"
        />
      </div>
      <button
        @click="handleDelete"
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
        title="Delete Teacher Video"
      >
        <X class="w-3 h-3" />
      </button>
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
          @blur="updateBlockData()"
          type="url"
          placeholder="https://example.com/video.mp4"
          class="input input-bordered input-xs"
        />
      </div>
      <div v-if="sourceType === 'upload' && !videoUrl">
        <label class="label">
           <span class="label-text text-xs">File</span>
        </label>
        <button @click="handleAddVideo" class="btn btn-sm btn-outline btn-accent w-full">
          <Upload class="w-3 h-3 mr-2" />
          <span>Add Video (max 15mb)</span>
        </button>
      </div>
    </div>

    <!-- Video Preview -->
    <div v-if="videoUrl" class="preview-container space-y-2">
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
      </div>
    </div>

    <!-- Transcript Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Transcript</span>
      </label>
      <textarea
        v-model="transcript"
        @blur="updateBlockData()"
        placeholder="Enter video transcript"
        class="textarea textarea-bordered textarea-xs h-20 resize-none"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 