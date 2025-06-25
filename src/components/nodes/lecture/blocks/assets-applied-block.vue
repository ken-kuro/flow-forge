<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, Link, Image as ImageIcon, Video as VideoIcon } from 'lucide-vue-next';
import InlineEditText from '@/components/shared/inline-edit-text.vue';

/**
 * AssetsAppliedBlock - A simplified block for referencing assets from Setup nodes.
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
     * @type {{id: string, type: string, data: {title: string, setupNodeId: string, assetId: string}}}
     */
  block: {
    type: Object,
    required: true,
  },
});

const { updateBlock, removeBlock, flushPendingSaves, getAvailableAssets, getAssetFromSetup } = useFlowEditor();

// Flush any pending saves when component is unmounted
onUnmounted(() => {
  flushPendingSaves();
});

// Local reactive copies for editing
const title = ref(props.block.data.title || '');
const selectedAssetKey = ref(props.block.data.selectedAssetKey || '');

// Get available assets from setup nodes
const availableAssets = computed(() => getAvailableAssets());

// Create options for the select dropdown
const assetOptions = computed(() => {
  const options = [];
  availableAssets.value.forEach(asset => {
    const key = `${asset.setupNodeId}-${asset.assetId}`;
    options.push({
      value: key,
      label: `${asset.setupNodeTitle} > ${asset.assetTitle || 'Untitled Asset'} (${asset.assetType.replace('asset-', '')})`
    });
  });
  return options;
});

// Get the currently selected asset data
const selectedAsset = computed(() => {
  if (!selectedAssetKey.value) return null;
  const [setupNodeId, assetId] = selectedAssetKey.value.split('-');
  return getAssetFromSetup(setupNodeId, assetId);
});

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    selectedAssetKey: selectedAssetKey.value,
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
        <Link class="w-4 h-4 text-secondary" />
        <InlineEditText
          v-model="title"
          @update:modelValue="updateBlockData(true)"
          placeholder="Enter assets applied block name"
          class="text-sm font-medium"
        />
      </div>
      <button
        @click="handleDelete"
        class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
        title="Delete Assets Applied Block"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Asset Selection -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Select Asset</span>
      </label>
      <select
        v-model="selectedAssetKey"
        @change="updateBlockData(true)"
        class="select select-bordered select-xs"
      >
        <option value="">Choose an asset...</option>
        <option v-for="option in assetOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <div v-if="assetOptions.length === 0" class="text-xs text-base-content/50 mt-1">
        No assets available. Create assets in Setup nodes first.
      </div>
    </div>

        <!-- Asset Preview -->
    <div v-if="selectedAsset" class="preview-container space-y-2">
      <label class="label">
        <span class="label-text text-xs">Preview</span>
      </label>
      
      <!-- Debug info (remove after testing) -->
      <div class="text-xs text-base-content/50 p-2 bg-base-300 rounded">
        <div>Type: {{ selectedAsset.type }}</div>
        <div>imageUrl: {{ selectedAsset.data?.imageUrl || 'not set' }}</div>
        <div>videoUrl: {{ selectedAsset.data?.videoUrl || 'not set' }}</div>
        <div>Data keys: {{ Object.keys(selectedAsset.data || {}).join(', ') }}</div>
      </div>
      
      <div class="w-full h-32 bg-base-200 rounded flex items-center justify-center overflow-hidden relative">
        <!-- Image Preview -->
        <img
          v-if="selectedAsset.type === 'asset-image' && selectedAsset.data.imageUrl"
          :src="selectedAsset.data.imageUrl"
          :alt="selectedAsset.data.title"
          class="max-w-full max-h-full object-contain"
        />
        <!-- Video Preview -->
        <video
          v-else-if="selectedAsset.type === 'asset-video' && selectedAsset.data.videoUrl"
          :src="selectedAsset.data.videoUrl"
          controls
          class="max-w-full max-h-full"
          preload="metadata"
        ></video>
        <!-- Fallback for missing or invalid assets -->
        <div v-else class="flex flex-col items-center gap-2 text-base-content/50 text-xs text-center">
          <component 
            :is="selectedAsset.type === 'asset-image' ? ImageIcon : VideoIcon" 
            class="w-8 h-8" 
          />
          <span v-if="selectedAsset.type === 'asset-image'">
            {{ selectedAsset.data.imageUrl ? 'Image failed to load' : 'No image URL set' }}
          </span>
          <span v-else-if="selectedAsset.type === 'asset-video'">
            {{ selectedAsset.data.videoUrl ? 'Video failed to load' : 'No video URL set' }}
          </span>
          <span v-else>No preview available</span>
        </div>
      </div>
    </div>


  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 