<script setup>
import { ref, onUnmounted, computed, watch } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { X, Image as ImageIcon, Upload } from 'lucide-vue-next'
import { useModal } from '@/composables/use-modal'
import SetupImageModal from '../setup-image-modal.vue'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'
import { useFlowContextStore } from '@/stores/flow-context-store.js'
import StopPropagationWrapper from '@/components/shared/stop-propagation-wrapper.vue'

/**
 * ImageAssetBlock - A block for defining image assets in Setup nodes.
 * Enforces the constraint that only one image can have elements configuration per flow.
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
const flowContextStore = useFlowContextStore()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = ref(props.block.data.title ?? 'Image Asset')
const sourceType = ref(props.block.data.sourceType || 'url')
const imageUrl = ref(props.block.data.imageUrl ?? '')
const applyToAll = ref(props.block.data.applyToAll ?? false)

// CONFIG FIELDS - Define the elements context (editable in admin mode, read-only in collaborator mode)
const hasObjectsConfig = ref(props.block.data.hasObjectsConfig ?? false)
const hasTextsConfig = ref(props.block.data.hasTextsConfig ?? false)

// DATA FIELDS - Actual elements data (always editable)
const objects = ref(props.block.data.objects || [])
const texts = ref(props.block.data.texts || [])

// Computed property for total element count
const totalElementsCount = computed(() => objects.value.length + texts.value.length)

// Check if this block currently has elements
const hasElements = computed(() => totalElementsCount.value > 0)

// Check if another image asset already has elements configuration
const anotherImageHasElements = computed(() => {
    const imageAssetWithElements = flowContextStore.imageAssetWithElements
    return imageAssetWithElements && imageAssetWithElements.id !== props.block.id
})

// Check if this block can have elements (either it already has them or no other block has them)
const canHaveElements = computed(() => {
    return hasElements.value || !anotherImageHasElements.value
})

// Validation status
const elementsValidation = computed(() => {
    if (anotherImageHasElements.value && hasElements.value) {
        return {
            isValid: false,
            message: `Another image "${flowContextStore.imageAssetWithElements.data.title}" already has elements configuration`,
        }
    }
    return { isValid: true, message: '' }
})

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        imageUrl: imageUrl.value,
        sourceType: sourceType.value,
        applyToAll: applyToAll.value,
        // CONFIG FIELDS
        hasObjectsConfig: hasObjectsConfig.value,
        hasTextsConfig: hasTextsConfig.value,
        // DATA FIELDS
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
    // Validate that elements conform to config constraints
    const hasObjects = data.objects && data.objects.length > 0
    const hasTexts = data.texts && data.texts.length > 0

    // Check if user is trying to add objects when config doesn't allow it
    if (hasObjects && !hasObjectsConfig.value) {
        alert('Cannot add objects: Image is configured to not have objects. Update the configuration first.')
        return
    }

    // Check if user is trying to add texts when config doesn't allow it
    if (hasTexts && !hasTextsConfig.value) {
        alert('Cannot add texts: Image is configured to not have texts. Update the configuration first.')
        return
    }

    // Check if we can add elements before saving (existing constraint)
    if (!canHaveElements.value && (hasObjects || hasTexts)) {
        alert(
            `Cannot add elements: Another image "${flowContextStore.imageAssetWithElements.data.title}" already has elements configuration. Only one image per flow can have elements.`,
        )
        return
    }

    objects.value = data.objects || []
    texts.value = data.texts || []

    // Config fields remain unchanged - they control what's allowed
    updateBlockData(true)
}

const openSetupImageModal = () => {
    // Show warning if trying to add elements when another image has them
    if (!canHaveElements.value) {
        alert(
            `Cannot configure elements: Another image "${flowContextStore.imageAssetWithElements.data.title}" already has elements configuration. Only one image per flow can have elements.`,
        )
        return
    }

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

const clearElements = () => {
    // Analyze impact before clearing elements
    const impact = flowContextStore.analyzeAssetChangeImpact(props.block.id, 'elements-change')

    if (!flowContextStore.confirmAssetChange(impact, 'clear all elements configuration')) {
        return // User cancelled
    }

    // User confirmed, proceed with clearing
    if (impact.affectedBlocks.length > 0) {
        flowContextStore.resetAffectedBlocks(impact.affectedBlocks)
    }

    // Clear only the actual elements data, not the config
    objects.value = []
    texts.value = []

    updateBlockData()
}

// Watch for config changes and clear conflicting data
watch(hasObjectsConfig, (newValue) => {
    if (!newValue && objects.value.length > 0) {
        const shouldClear = confirm('Disabling objects configuration will remove all existing objects. Continue?')
        if (shouldClear) {
            objects.value = []
            updateBlockData(true)
        } else {
            // Revert the config change
            hasObjectsConfig.value = true
        }
    }
})

watch(hasTextsConfig, (newValue) => {
    if (!newValue && texts.value.length > 0) {
        const shouldClear = confirm('Disabling texts configuration will remove all existing texts. Continue?')
        if (shouldClear) {
            texts.value = []
            updateBlockData(true)
        } else {
            // Revert the config change
            hasTextsConfig.value = true
        }
    }
})

// Show elements configuration UI only when at least one config is enabled
const showElementsConfig = computed(() => {
    return hasObjectsConfig.value || hasTextsConfig.value
})
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
        <!-- Elements Validation Warning -->
        <div v-if="!elementsValidation.isValid" class="alert alert-error text-xs mb-2">
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
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
                <div class="flex flex-col">
                    <span>{{ elementsValidation.message }}</span>
                    <button @click="clearElements" class="btn btn-xs btn-error mt-1">Clear elements to resolve</button>
                </div>
            </div>
        </div>

        <!-- Elements Constraint Info -->
        <div v-if="hasElements" class="alert alert-success text-xs mb-2">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
                <span>This image has elements configuration for the flow</span>
            </div>
        </div>

        <!-- Elements Configuration -->
        <div class="form-control mb-2">
            <label class="label">
                <span class="label-text text-xs font-medium">Elements Configuration</span>
            </label>
            <div class="flex gap-4">
                <label class="label cursor-pointer justify-start gap-2">
                    <input
                        type="checkbox"
                        v-model="hasObjectsConfig"
                        @change="updateBlockData(true)"
                        class="checkbox checkbox-xs checkbox-primary"
                    />
                    <span class="label-text text-xs">Has Objects</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2">
                    <input
                        type="checkbox"
                        v-model="hasTextsConfig"
                        @change="updateBlockData(true)"
                        class="checkbox checkbox-xs checkbox-primary"
                    />
                    <span class="label-text text-xs">Has Texts</span>
                </label>
            </div>
            <div class="label">
                <span class="label-text-alt text-xs text-base-content/50">
                    Configure what types of elements this image supports
                </span>
            </div>
        </div>

        <!-- Source Type Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Source</span>
            </label>
            <StopPropagationWrapper>
                <select v-model="sourceType" @change="handleSourceTypeChange" class="select select-bordered select-xs">
                    <option value="url">From URL</option>
                    <option value="upload">Upload Image</option>
                </select>
            </StopPropagationWrapper>
        </div>

        <!-- URL Input or Upload Button -->
        <div class="form-control">
            <div v-if="sourceType === 'url'">
                <label class="label">
                    <span class="label-text text-xs">Image URL</span>
                </label>
                <StopPropagationWrapper>
                    <input
                        v-model="imageUrl"
                        @blur="updateBlockData"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        class="input input-bordered input-xs"
                    />
                </StopPropagationWrapper>
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
            <div class="w-full h-32 bg-base-200 rounded flex items-center justify-center overflow-hidden relative">
                <img :src="imageUrl" :alt="title" class="max-w-full max-h-full object-contain" />
                <!-- Remove button on preview -->
                <div class="absolute top-1 right-1">
                    <button @click="removeImage" class="btn btn-xs btn-circle btn-error">
                        <X class="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Elements Configuration -->
        <div v-if="imageUrl && showElementsConfig" class="form-control">
            <label class="label">
                <span class="label-text text-xs">Elements Configuration</span>
            </label>

            <!-- Elements Summary -->
            <div v-if="totalElementsCount > 0" class="mb-2 p-2 bg-base-200 rounded text-xs">
                <div class="flex items-center justify-between">
                    <span>{{ objects.length }} objects, {{ texts.length }} texts</span>
                    <button @click="openSetupImageModal" class="btn btn-xs btn-outline">Edit Elements</button>
                </div>
            </div>

            <!-- Add Elements Button -->
            <div v-else>
                <button
                    @click="openSetupImageModal"
                    class="btn btn-sm btn-outline w-full"
                    :disabled="!canHaveElements"
                    :class="{ 'btn-disabled': !canHaveElements }"
                >
                    <span v-if="canHaveElements">Add Elements Configuration</span>
                    <span v-else>Elements config already exists in another image</span>
                </button>
                <div class="label">
                    <span class="label-text-alt text-xs text-base-content/50">
                        Optional: Define interactive objects and texts
                    </span>
                </div>
            </div>
        </div>

        <!-- Apply to All Option (deprecated in simplified system) -->
        <div v-if="false" class="form-control">
            <label class="label cursor-pointer justify-start gap-2">
                <input
                    v-model="applyToAll"
                    @change="updateBlockData(true)"
                    type="checkbox"
                    class="checkbox checkbox-xs checkbox-primary"
                />
                <span class="label-text text-xs">Apply to all nodes in flow</span>
            </label>
            <div class="label">
                <span class="label-text-alt text-xs text-base-content/50">
                    Sets this as the default image for all nodes
                </span>
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
