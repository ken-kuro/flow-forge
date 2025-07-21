<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { Link, Image as ImageIcon, Video as VideoIcon, BookOpenText as LMSIcon } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import { useFlowContextStore } from '@/stores/flow-context-store.js'
import { LMS_TYPES } from '../../setup/blocks/lms'

/**
 * AssetsAppliedBlock - A simplified block for applying assets from the single Setup node.
 * Enforces asset loading rules based on LMS type and supports the simplified context-aware asset system.
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
     * @type {{id: string, type: string, data: {title: string, selectedAssetId: string, assetType: string}}}
     */
    block: {
        type: Object,
        required: true,
    },
})

const { updateBlock, flushPendingSaves, getNodeBlocks } = useFlowEditor()
const flowContextStore = useFlowContextStore()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.title ?? 'Assets Applied')
const selectedAssetId = ref(props.block.data.selectedAssetId ?? '')
const assetType = ref(props.block.data.assetType ?? 'any') // 'image', 'video', 'lms', 'any'

// Get available assets from the single setup node
const availableAssets = computed(() => {
    return flowContextStore.getAvailableAssetsForNode(props.nodeId)
})

// Get existing asset blocks in this node
const existingAssetBlocks = computed(() => {
    return getNodeBlocks(props.nodeId).filter((block) => block.type === 'assets-applied' && block.id !== props.block.id)
})

// Get asset type constraints
const assetTypeConstraints = computed(() => {
    const constraints = {
        maxBlocks: flowContextStore.getMaxAssetBlocksForNode(props.nodeId),
        allowsDual: flowContextStore.allowsDualAssetBlocks,
        usedAssetTypes: existingAssetBlocks.value.map((block) => block.data.assetType || 'any'),
    }

    return constraints
})

// Filter available asset options - now always show all assets, detect conflicts after selection
const filteredAssetOptions = computed(() => {
    const options = []

    // Always show all available assets - let user choose, then warn about conflicts
    availableAssets.value.images.forEach((asset) => {
        options.push({
            id: asset.id,
            type: 'image',
            label: `${asset.data.title} (Image)`,
            data: asset.data,
        })
    })

    availableAssets.value.videos.forEach((asset) => {
        options.push({
            id: asset.id,
            type: 'video',
            label: `${asset.data.title} (Video)`,
            data: asset.data,
        })
    })

    if (availableAssets.value.lms) {
        options.push({
            id: availableAssets.value.lms.id,
            type: 'lms',
            label: `${availableAssets.value.lms.data.title} (LMS)`,
            data: availableAssets.value.lms.data,
        })
    }

    return options
})

// Detect conflicts in current selection
const conflictWarning = computed(() => {
    if (!selectedAssetId.value) return null

    const selectedOption = filteredAssetOptions.value.find((opt) => opt.id === selectedAssetId.value)
    if (!selectedOption) return null

    const { allowsDual } = assetTypeConstraints.value
    const existingTypes = existingAssetBlocks.value.map((block) => {
        const option = filteredAssetOptions.value.find((opt) => opt.id === block.data.selectedAssetId)
        return option?.type || 'unknown'
    })

    // For non-speaking types (single asset only)
    if (!allowsDual && existingAssetBlocks.value.length > 0) {
        return 'This LMS configuration only allows one asset block per node'
    }

    // For speaking types (dual assets)
    if (allowsDual) {
        const selectedType = selectedOption.type

        if (['image', 'video'].includes(selectedType) && existingTypes.some((t) => ['image', 'video'].includes(t))) {
            return 'Only one image or video asset allowed per node'
        }

        if (selectedType === 'lms' && existingTypes.includes('lms')) {
            return 'Only one LMS asset allowed per node'
        }
    }

    return null
})

// Get the currently selected asset
const selectedAsset = computed(() => {
    if (!selectedAssetId.value) return null
    return filteredAssetOptions.value.find((option) => option.id === selectedAssetId.value) || null
})

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        selectedAssetId: selectedAssetId.value,
        assetType: assetType.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

// Handle asset selection
const handleAssetSelect = (assetKey) => {
    const option = filteredAssetOptions.value.find((opt) => opt.id === assetKey)
    if (option) {
        selectedAssetId.value = option.id
        assetType.value = option.type
        updateBlockData(true)
    }
}

// Watch for context changes and validate current selection
watch(
    [() => flowContextStore.setupNode, () => flowContextStore.lmsType, () => flowContextStore.questionType],
    () => {
        // Check if current selection is still valid
        if (selectedAssetId.value) {
            const isValid = filteredAssetOptions.value.some((opt) => opt.id === selectedAssetId.value)
            if (!isValid) {
                selectedAssetId.value = ''
                assetType.value = 'any'
                updateBlockData(true)
            }
        }
    },
    { immediate: true },
)

// Helper function to get LMS asset subtype label
const getLmsAssetLabel = (assetData) => {
    if (!assetData || !assetData.lmsType || assetData.lmsType === null) return 'LMS'

    const typeLabel = assetData.lmsType.charAt(0).toUpperCase() + assetData.lmsType.slice(1)

    // If it's a practice with a specific question, show more details
    if (assetData.lmsType === LMS_TYPES.PRACTICE && assetData.questionData) {
        return `${typeLabel} - Q${assetData.questionData.id}`
    }

    return typeLabel
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
        <!-- Conflict Warning -->
        <div v-if="conflictWarning" class="alert alert-warning text-xs mb-2">
            <div class="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="stroke-current shrink-0 w-4 h-4"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    ></path>
                </svg>
                <span>{{ conflictWarning }}</span>
            </div>
        </div>

        <!-- Asset Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Select Asset</span>
            </label>

            <!-- Show asset dropdown when options are available -->
            <div v-if="filteredAssetOptions.length > 0">
                <select
                    :value="selectedAssetId"
                    @change="handleAssetSelect($event.target.value)"
                    class="select select-bordered select-xs"
                >
                    <option value="">Choose an asset...</option>
                    <option v-for="option in filteredAssetOptions" :key="option.id" :value="option.id">
                        {{ option.label }}
                    </option>
                </select>
            </div>

            <!-- Show message when no assets available -->
            <div v-else class="select select-bordered select-xs w-full flex items-center text-base-content/50">
                <span v-if="!flowContextStore.setupNode"> No setup node found </span>
                <span v-else> No assets available in setup node </span>
            </div>
        </div>

        <!-- Asset Preview -->
        <div v-if="selectedAsset" class="preview-container">
            <label class="label">
                <span class="label-text text-xs">Preview</span>
            </label>

            <!-- LMS Asset Preview -->
            <div v-if="selectedAsset.type === 'lms'" class="w-full p-3 bg-base-200 rounded">
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
                        <div>
                            <strong>Question:</strong>
                            {{ selectedAsset.data.questionData.content || 'No question content' }}
                        </div>
                        <div>
                            <strong>Question Type:</strong>
                            {{ selectedAsset.data.questionData.type || 'No question type' }}
                        </div>
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
                    v-if="selectedAsset.type === 'image' && selectedAsset.data.imageUrl"
                    :src="selectedAsset.data.imageUrl"
                    :alt="selectedAsset.data.title"
                    class="max-w-full max-h-full object-contain"
                />
                <!-- Video Preview -->
                <video
                    v-else-if="selectedAsset.type === 'video' && selectedAsset.data.videoUrl"
                    :src="selectedAsset.data.videoUrl"
                    controls
                    class="max-w-full max-h-full"
                    preload="metadata"
                ></video>
                <!-- Fallback for missing or invalid assets -->
                <div v-else class="flex flex-col items-center gap-2 text-base-content/50 text-xs text-center">
                    <component :is="selectedAsset.type === 'image' ? ImageIcon : VideoIcon" class="w-8 h-8" />
                    <span v-if="selectedAsset.type === 'image'">
                        {{ selectedAsset.data.imageUrl ? 'Image failed to load' : 'No image URL set' }}
                    </span>
                    <span v-else-if="selectedAsset.type === 'video'">
                        {{ selectedAsset.data.videoUrl ? 'Video failed to load' : 'No video URL set' }}
                    </span>
                    <span v-else>No preview available</span>
                </div>
            </div>

            <!-- Asset Details -->
            <div class="mt-2 text-xs text-base-content/70">
                <div><strong>Type:</strong> {{ selectedAsset.type }}</div>
                <div
                    v-if="
                        selectedAsset.type === 'image' &&
                        selectedAsset.data.objects &&
                        selectedAsset.data.objects.length > 0
                    "
                >
                    <strong>Objects:</strong> {{ selectedAsset.data.objects.length }} configured
                </div>
                <div
                    v-if="
                        selectedAsset.type === 'image' &&
                        selectedAsset.data.texts &&
                        selectedAsset.data.texts.length > 0
                    "
                >
                    <strong>Texts:</strong> {{ selectedAsset.data.texts.length }} configured
                </div>
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
