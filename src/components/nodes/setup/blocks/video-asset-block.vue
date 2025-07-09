<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { X, Video as VideoIcon, Upload } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import StopPropagationTextArea from '@/components/shared/stop-propagation-textarea.vue'

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
     * @type {{id: string, type: string, data: {assetId: string, videoUrl: string, title: string, duration: number, thumbnail: string, sourceType: 'url'|'upload', applyToAll: boolean}}}
     */
    block: {
        type: Object,
        required: true,
    },
})

const { updateBlock, flushPendingSaves } = useFlowEditor()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.title ?? 'Video Asset')
const description = ref(props.block.data.description ?? '')
const sourceType = ref(props.block.data.sourceType || 'url')
const videoUrl = ref(props.block.data.videoUrl ?? '')
const applyToAll = ref(props.block.data.applyToAll ?? false)

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        description: description.value,
        sourceType: sourceType.value,
        videoUrl: videoUrl.value,
        applyToAll: applyToAll.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

const handleAddVideo = () => {
    // TODO: Implement proper video upload functionality
    alert('Video upload functionality is not implemented yet.')
    // For now, let's set a placeholder to simulate a successful "upload"
    videoUrl.value = 'https://www.w3schools.com/html/mov_bbb.mp4'
    updateBlockData(true)
}

const handleSourceTypeChange = () => {
    videoUrl.value = ''
    updateBlockData(true)
}

const removeVideo = () => {
    videoUrl.value = ''
    updateBlockData(true)
}

// Preview state
const showPreview = computed(() => videoUrl.value && videoUrl.value.trim() !== '')
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="VideoIcon"
        icon-color="text-secondary"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter asset name"
    >
        <!-- Description Field -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Description</span>
            </label>
            <StopPropagationTextArea
                v-model="description"
                @blur="updateBlockData"
                placeholder="Enter video description"
            />
        </div>

        <!-- Source Type Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Source</span>
            </label>
            <select v-model="sourceType" @change="handleSourceTypeChange" class="select select-bordered select-xs">
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
        <div v-if="showPreview" class="preview-container">
            <label class="label">
                <span class="label-text text-xs">Preview</span>
            </label>
            <div class="w-full h-32 bg-base-200 rounded flex items-center justify-center overflow-hidden relative">
                <video :src="videoUrl" controls class="max-w-full max-h-full"></video>
                <!-- Remove button on preview -->
                <div class="absolute top-1 right-1">
                    <button @click="removeVideo" class="btn btn-xs btn-circle btn-error">
                        <X class="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>

        <!-- TODO: Revisit this after we decide on the behavior of apply to all nodes, hide for now -->
        <div v-if="false">
            <!-- Apply to all nodes checkbox -->
            <div class="form-control">
                <label class="label cursor-pointer justify-start gap-2 p-0">
                    <input
                        type="checkbox"
                        v-model="applyToAll"
                        @change="updateBlockData(true)"
                        class="checkbox checkbox-xs checkbox-secondary"
                    />
                    <span class="label-text text-xs">Apply to all nodes of this type</span>
                </label>
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
