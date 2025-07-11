<script setup>
import { ref, onUnmounted, computed } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { X, Image as ImageIcon, Upload } from 'lucide-vue-next'
import { useModal } from '@/composables/use-modal'
import SetupImageModal from '../setup-image-modal.vue'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'

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
     * @type {{id: string, type: string, data: {title: string, imageUrl: string, sourceType: 'url'|'upload', applyToAll: boolean, objects: Array<any>, texts: Array<any>}}}
     */
    block: {
        type: Object,
        required: true,
    },
})

const { updateBlock, flushPendingSaves } = useFlowEditor()
const { showModal } = useModal()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.title ?? 'Image Asset')
const sourceType = ref(props.block.data.sourceType || 'url')
const imageUrl = ref(props.block.data.imageUrl ?? '')
const applyToAll = ref(props.block.data.applyToAll ?? false)
const objects = ref(props.block.data.objects || [])
const texts = ref(props.block.data.texts || [])

// Computed property for total element count
const totalElementsCount = computed(() => objects.value.length + texts.value.length)

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        imageUrl: imageUrl.value,
        sourceType: sourceType.value,
        applyToAll: applyToAll.value,
        objects: objects.value,
        texts: texts.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

const handleAddImage = () => {
    // TODO: Implement proper image upload functionality
    alert('Image upload functionality is not implemented yet.')
    // For now, let's set a placeholder image to see the preview
    imageUrl.value = `https://picsum.photos/seed/${Date.now()}/400/200`
    updateBlockData(true)
}

const handleSourceTypeChange = () => {
    imageUrl.value = ''
    updateBlockData(true)
}

const removeImage = () => {
    imageUrl.value = ''
    updateBlockData(true)
}

const handleSaveElements = (data) => {
    objects.value = data.objects || []
    texts.value = data.texts || []
    updateBlockData(true)
}

const openSetupImageModal = () => {
    showModal(
        SetupImageModal,
        {
            imageUrl: imageUrl.value,
            initialObjects: objects.value,
            initialTexts: texts.value,
            onSave: handleSaveElements,
        },
        {
            size: 'full',
            height: 'full',
            title: 'Set up image',
            showFooter: true,
            primaryButtonText: 'Save',
            secondaryButtonText: 'Cancel',
            bodyPadding: false,
        },
    )
}
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="ImageIcon"
        icon-color="text-primary"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter asset name"
    >
        <!-- Source Type Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Source</span>
            </label>
            <select v-model="sourceType" @change="handleSourceTypeChange" class="select select-bordered select-xs">
                <option value="url">From URL</option>
                <option value="upload">Upload Image</option>
            </select>
        </div>

        <!-- URL Input or Upload Button -->
        <div class="form-control">
            <div v-if="sourceType === 'url'">
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
            <div v-if="sourceType === 'upload' && !imageUrl">
                <label class="label">
                    <span class="label-text text-xs">File</span>
                </label>
                <button @click="handleAddImage" class="btn btn-sm btn-outline btn-primary w-full">
                    <Upload class="w-3 h-3 mr-2" />
                    <span>Add Image (max 15mb)</span>
                </button>
            </div>
        </div>

        <!-- Image Preview -->
        <div v-if="imageUrl" class="preview-container">
            <label class="label">
                <span class="label-text text-xs">Preview</span>
            </label>
            <div class="relative w-full h-32 bg-base-200 rounded flex items-center justify-center overflow-hidden">
                <img :src="imageUrl" :alt="title ?? 'Image preview'" class="max-w-full max-h-full object-contain" />
                <!-- Action buttons on preview -->
                <div class="absolute top-1 right-1 flex flex-col gap-1">
                    <button @click="openSetupImageModal" class="btn btn-xs btn-primary btn-outline">
                        Set image elements ({{ totalElementsCount }})
                    </button>
                    <button @click="removeImage" class="btn btn-xs btn-circle btn-error self-end">
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
                        class="checkbox checkbox-xs checkbox-primary"
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
