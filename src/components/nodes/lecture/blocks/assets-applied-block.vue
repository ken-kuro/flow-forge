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
const setupNodeId = ref(props.block.data.setupNodeId || '');
const assetId = ref(props.block.data.assetId || '');

// Get available assets from setup nodes
const availableAssets = computed(() => getAvailableAssets());

// Get the currently selected asset data
const selectedAsset = computed(() => {
  if (!setupNodeId.value || !assetId.value) return null;
  const asset = getAssetFromSetup(setupNodeId.value, assetId.value);
  return asset;
});

// Grouped assets by setup node for easier selection
const groupedAssets = computed(() => {
  const groups = {};
  availableAssets.value.forEach(asset => {
    if (!groups[asset.setupNodeId]) {
      groups[asset.setupNodeId] = {
        setupNodeTitle: asset.setupNodeTitle,
        assets: []
      };
    }
    groups[asset.setupNodeId].assets.push(asset);
  });
  return groups;
});

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    setupNodeId: setupNodeId.value,
    assetId: assetId.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
};

const handleAssetSelection = (selectedSetupNodeId, selectedAssetId) => {
  setupNodeId.value = selectedSetupNodeId;
  assetId.value = selectedAssetId;
  updateBlockData(true);
};

// Get icon for asset type
const getAssetIcon = (assetType) => {
  return assetType === 'asset-image' ? ImageIcon : VideoIcon;
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
      <div v-if="Object.keys(groupedAssets).length === 0" class="text-xs text-base-content/50 p-2 bg-base-200 rounded">
        No assets available. Create assets in Setup nodes first.
      </div>
      <div v-else class="space-y-2">
        <div v-for="(group, nodeId) in groupedAssets" :key="nodeId" class="border border-base-300 rounded p-2">
          <div class="text-xs font-medium text-base-content/70 mb-1">{{ group.setupNodeTitle }}</div>
          <div class="space-y-1">
            <div 
              v-for="asset in group.assets" 
              :key="asset.assetId"
              @click="handleAssetSelection(nodeId, asset.assetId)"
              :class="[
                'flex items-center gap-2 p-2 rounded cursor-pointer text-xs transition-colors',
                setupNodeId === nodeId && assetId === asset.assetId
                  ? 'bg-secondary text-secondary-content' 
                  : 'hover:bg-base-200'
              ]"
            >
              <component :is="getAssetIcon(asset.assetType)" class="w-3 h-3" />
              <span class="flex-1">{{ asset.assetTitle || 'Untitled Asset' }}</span>
              <span class="text-xs opacity-50">{{ asset.assetType.replace('asset-', '') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Asset Preview -->
    <div v-if="selectedAsset" class="preview-container space-y-2">
      <label class="label">
        <span class="label-text text-xs">Preview</span>
      </label>
      <div class="w-full h-32 bg-base-200 rounded flex items-center justify-center overflow-hidden relative">
        <!-- Image Preview -->
        <img
          v-if="selectedAsset.type === 'asset-image'"
          :src="selectedAsset.data.imageUrl"
          :alt="selectedAsset.data.title"
          class="max-w-full max-h-full object-contain"
        />
        <!-- Video Preview -->
        <video
          v-else-if="selectedAsset.type === 'asset-video'"
          :src="selectedAsset.data.videoUrl"
          controls
          class="max-w-full max-h-full"
          preload="metadata"
        ></video>
      </div>
    </div>


  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style> 