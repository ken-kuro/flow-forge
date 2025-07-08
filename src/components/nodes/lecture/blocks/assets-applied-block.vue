<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { Link, Image as ImageIcon, Video as VideoIcon } from 'lucide-vue-next';
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue';

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

const { updateBlock, flushPendingSaves, getAvailableAssets, getAssetFromSetup } = useFlowEditor();

// Flush any pending saves when component is unmounted
onUnmounted(() => {
  flushPendingSaves();
});

// Local reactive copies for editing
const title = computed({
  get: () => props.block.data.title || 'Assets Applied',
  set: (val) => {
    props.block.data.title = val;
    updateBlockData();
  }
});
const selectedAssetKey = ref(props.block.data.selectedAssetKey ?? '');

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

</script>

<template>
  <CardBlockWrapper
    v-model="title"
    :icon="Link"
    icon-color="text-secondary"
    :node-id="nodeId"
    :block-id="block.id"
    placeholder="Enter assets applied block name"
  >
    <!-- Asset Selection -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Select Asset</span>
      </label>
      <select
        v-model="selectedAssetKey"
        @blur="updateBlockData"
        class="select select-bordered select-xs"
      >
        <option value="">Choose an asset...</option>
        <option v-for="option in assetOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <div v-if="assetOptions.length === 0" class="text-xs text-base-content/50">
        No assets available. Create assets in Setup nodes first.
      </div>
    </div>

    TODO: FIX THIS NEXT
    <!-- Asset Preview -->
    <div v-if="selectedAsset" class="preview-container">
      <label class="label">
        <span class="label-text text-xs">Preview</span>
      </label>
      
      <!-- Debug info (remove after testing) -->
      <div class="text-xs text-base-content/50 p-2 bg-base-300 rounded">
        <div>Type: {{ selectedAsset.type }}</div>
        <div>imageUrl: {{ selectedAsset.data?.imageUrl ||'not set' }}</div>
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
  </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>