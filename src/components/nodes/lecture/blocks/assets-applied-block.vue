<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { Link, Image as ImageIcon, Video as VideoIcon, BookOpenText as LMSIcon } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'

/**
 * AssetsAppliedBlock - A simplified block for referencing assets from Setup nodes.
 * Supports image, video, and LMS assets.
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
})

const { updateBlock, flushPendingSaves, getAvailableAssets, getAssetFromSetup } = useFlowEditor()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.title ?? 'Assets Applied')
const selectedAssetKey = ref(props.block.data.selectedAssetKey ?? '')

// TODO: Revisit this in the future. I think we need to filter only the assets that are connected
// Get available assets from setup nodes
const availableAssets = computed(() => getAvailableAssets())

// Helper function to get asset type label
const getAssetTypeLabel = (assetType) => {
    switch (assetType) {
        case 'asset-image':
            return 'Image'
        case 'asset-video':
            return 'Video'
        case 'asset-lms':
            return 'LMS'
        default:
            return assetType.replace('asset-', '')
    }
}

// Helper function to get LMS asset subtype label
const getLmsAssetLabel = (assetData) => {
    if (!assetData || !assetData.lmsType) return 'LMS'

    const typeLabel = assetData.lmsType.charAt(0).toUpperCase() + assetData.lmsType.slice(1)

    // If it's a practice with a specific question, show more details
    if (assetData.lmsType === 'practice' && assetData.questionData) {
        return `${typeLabel} - Q${assetData.questionData.id}`
    }

    return typeLabel
}

// Create options for the select dropdown
const assetOptions = computed(() => {
    const options = []
    availableAssets.value.forEach((asset) => {
        const key = `${asset.setupNodeId}::${asset.assetId}`
        let label = `${asset.setupNodeTitle} > ${asset.assetTitle || 'Untitled Asset'}`

        // Add specific labeling for LMS assets
        if (asset.assetType === 'asset-lms') {
            const lmsLabel = getLmsAssetLabel(asset.assetData)
            label += ` (${lmsLabel})`
        } else {
            label += ` (${getAssetTypeLabel(asset.assetType)})`
        }

        options.push({
            value: key,
            label: label,
        })
    })
    return options
})

// Get the currently selected asset data
const selectedAsset = computed(() => {
    if (!selectedAssetKey.value) return null
    const [setupNodeId, assetId] = selectedAssetKey.value.split('::')
    return getAssetFromSetup(setupNodeId, assetId)
})

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        selectedAssetKey: selectedAssetKey.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}
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
            <select v-model="selectedAssetKey" @blur="updateBlockData" class="select select-bordered select-xs">
                <option value="">Choose an asset...</option>
                <option v-for="option in assetOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
            <div v-if="assetOptions.length === 0" class="text-xs text-base-content/50">
                No assets available. Create assets in Setup nodes first.
            </div>
        </div>

        <!-- Asset Preview -->
        <div v-if="selectedAsset" class="preview-container">
            <label class="label">
                <span class="label-text text-xs">Preview</span>
            </label>

            <!-- LMS Asset Preview -->
            <div v-if="selectedAsset.type === 'asset-lms'" class="w-full p-3 bg-base-200 rounded">
                <div class="flex items-center gap-2 mb-2">
                    <LMSIcon class="w-4 h-4 text-accent" />
                    <span class="text-sm font-medium">{{ getLmsAssetLabel(selectedAsset.data) }}</span>
                </div>

                <!-- LMS Data Summary -->
                <div class="text-xs text-base-content/70 space-y-1">
                    <div><strong>Type:</strong> {{ selectedAsset.data.lmsType }}</div>
                    <div v-if="selectedAsset.data.lmsData">
                        <strong>Content:</strong> {{ selectedAsset.data.lmsData.content || 'No content' }}
                    </div>
                    <div v-if="selectedAsset.data.questionData">
                        <strong>Question:</strong>
                        {{ selectedAsset.data.questionData.content || 'No question content' }}
                    </div>
                </div>
            </div>

            <!-- Image/Video Preview -->
            <div
                v-else
                class="w-full h-32 bg-base-200 rounded flex items-center justify-center overflow-hidden relative"
            >
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
                    <component :is="selectedAsset.type === 'asset-image' ? ImageIcon : VideoIcon" class="w-8 h-8" />
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
