<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, Image as ImageIcon } from 'lucide-vue-next';

/**
 * ImageAssetBlock - A block for defining image assets in Setup nodes.
 * Allows editing of image URL, title, alt text, and asset ID.
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
   * @type {{id: string, type: string, data: {assetId: string, imageUrl: string, title: string, alt: string}}}
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
const imageUrl = ref(props.block.data.imageUrl || '');
const title = ref(props.block.data.title || '');
const alt = ref(props.block.data.alt || '');

// Update the store when values change
const updateBlockData = () => {
  const newData = {
    assetId: assetId.value,
    imageUrl: imageUrl.value,
    title: title.value,
    alt: alt.value,
  };
  updateBlock(props.nodeId, props.block.id, newData);
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
};

// Preview state
const showPreview = computed(() => imageUrl.value && imageUrl.value.trim() !== '');
</script>

<template>
  <div class="image-asset-block bg-base-100 border border-base-300 rounded-lg p-3 space-y-3">
    <!-- Block Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <ImageIcon class="w-4 h-4 text-primary" />
        <span class="text-sm font-medium">Image Asset</span>
      </div>
      <button 
        @click="handleDelete" 
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
        title="Delete Image Asset"
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
        placeholder="e.g., welcome-banner"
        class="input input-bordered input-xs"
      />
    </div>

    <!-- Image URL Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Image URL</span>
      </label>
      <input 
        v-model="imageUrl"
        @blur="updateBlockData"
        type="url" 
        placeholder="https://example.com/image.jpg"
        class="input input-bordered input-xs"
      />
    </div>

    <!-- Title and Alt Text Fields -->
    <div class="grid grid-cols-2 gap-2">
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Title</span>
        </label>
        <input 
          v-model="title"
          @blur="updateBlockData"
          type="text" 
          placeholder="Image title"
          class="input input-bordered input-xs"
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text text-xs">Alt Text</span>
        </label>
        <input 
          v-model="alt"
          @blur="updateBlockData"
          type="text" 
          placeholder="Description"
          class="input input-bordered input-xs"
        />
      </div>
    </div>

    <!-- Image Preview -->
    <div v-if="showPreview" class="preview-container">
      <div class="label">
        <span class="label-text text-xs">Preview</span>
      </div>
      <div class="w-full h-20 bg-base-200 rounded flex items-center justify-center overflow-hidden">
        <img 
          :src="imageUrl" 
          :alt="alt || 'Image preview'"
          class="max-w-full max-h-full object-contain"
          @error="$event.target.style.display = 'none'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-asset-block {
  /* Ensure consistent spacing and hover states */
  transition: all 0.2s ease;
}

.image-asset-block:hover {
  border-color: hsl(var(--bc) / 0.3);
}
</style> 