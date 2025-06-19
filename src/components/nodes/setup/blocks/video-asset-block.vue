<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, Video as VideoIcon } from 'lucide-vue-next';

/**
 * VideoAssetBlock - A block for defining video assets in Setup nodes.
 * Allows editing of video URL, title, duration, and thumbnail URL.
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
   * @type {{id: string, type: string, data: {assetId: string, videoUrl: string, title: string, duration: number, thumbnail: string}}}
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
const assetId = ref(props.block.data.assetId || '');
const videoUrl = ref(props.block.data.videoUrl || '');
const title = ref(props.block.data.title || '');
const duration = ref(props.block.data.duration || 0);
const thumbnail = ref(props.block.data.thumbnail || '');

// Update the store when values change
const updateBlockData = () => {
  const newData = {
    assetId: assetId.value,
    videoUrl: videoUrl.value,
    title: title.value,
    duration: Number(duration.value) || 0,
    thumbnail: thumbnail.value,
  };
  updateBlock(props.nodeId, props.block.id, newData);
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
};

// Format duration for display
const formatDuration = computed(() => {
  const dur = Number(duration.value) || 0;
  const minutes = Math.floor(dur / 60);
  const seconds = dur % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Preview state
const showThumbnail = computed(() => thumbnail.value && thumbnail.value.trim() !== '');
</script>

<template>
  <div class="video-asset-block bg-base-100 border border-base-300 rounded-lg p-3 space-y-3">
    <!-- Block Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <VideoIcon class="w-4 h-4 text-secondary" />
        <span class="text-sm font-medium">Video Asset</span>
      </div>
      <button 
        @click="handleDelete" 
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
        title="Delete Video Asset"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Asset ID Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Asset ID</span>
      </label>
      <input 
        v-model="assetId"
        @blur="updateBlockData"
        type="text" 
        placeholder="e.g., intro-video"
        class="input input-bordered input-xs"
      />
    </div>

    <!-- Video URL Field -->
    <div class="form-control">
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

    <!-- Title and Duration Fields -->
    <div class="grid grid-cols-2 gap-2">
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Title</span>
        </label>
        <input 
          v-model="title"
          @blur="updateBlockData"
          type="text" 
          placeholder="Video title"
          class="input input-bordered input-xs"
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Duration (seconds)</span>
        </label>
        <input 
          v-model="duration"
          @blur="updateBlockData"
          type="number" 
          min="0"
          placeholder="120"
          class="input input-bordered input-xs"
        />
        <div class="label">
          <span class="label-text-alt text-xs">{{ formatDuration }}</span>
        </div>
      </div>
    </div>

    <!-- Thumbnail URL Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Thumbnail URL (optional)</span>
      </label>
      <input 
        v-model="thumbnail"
        @blur="updateBlockData"
        type="url" 
        placeholder="https://example.com/thumbnail.jpg"
        class="input input-bordered input-xs"
      />
    </div>

    <!-- Thumbnail Preview -->
    <div v-if="showThumbnail" class="preview-container">
      <div class="label">
        <span class="label-text text-xs">Thumbnail Preview</span>
      </div>
      <div class="w-full h-20 bg-base-200 rounded flex items-center justify-center overflow-hidden relative">
        <img 
          :src="thumbnail" 
          :alt="`${title} thumbnail`"
          class="max-w-full max-h-full object-contain"
          @error="$event.target.style.display = 'none'"
        />
        <!-- Play icon overlay -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="bg-black bg-opacity-50 rounded-full p-2">
            <VideoIcon class="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-asset-block {
  /* Ensure consistent spacing and hover states */
  transition: all 0.2s ease;
}

.video-asset-block:hover {
  border-color: hsl(var(--bc) / 0.3);
}
</style> 