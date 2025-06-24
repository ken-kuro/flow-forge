<script setup>
import { ref, onUnmounted } from 'vue';
import { useFlowEditor } from '@/composables/use-flow-editor';
import { X, Image as ImageIcon, Upload } from 'lucide-vue-next';
import { useModal } from '@/composables/use-modal.js';
import ObjectDetectionModal from '@/components/editor/object-detection-modal.vue';

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
   * @type {{id: string, type: string, data: {title: string, imageUrl: string, sourceType: 'url'|'upload', applyToAll: boolean, objects: Array<any>}}}
   */
  block: {
    type: Object,
    required: true,
  },
});

const { updateBlock, removeBlock, flushPendingSaves } = useFlowEditor();
const { showModal } = useModal();

// Flush any pending saves when component is unmounted
onUnmounted(() => {
  flushPendingSaves();
});

// Local reactive copies for editing
const title = ref(props.block.data.title || '');
const imageUrl = ref(props.block.data.imageUrl || '');
const sourceType = ref(props.block.data.sourceType || 'url');
const applyToAll = ref(props.block.data.applyToAll || false);
const objects = ref(props.block.data.objects || []);

// Update the store when values change
const updateBlockData = (immediate = false) => {
  const newData = {
    title: title.value,
    imageUrl: imageUrl.value,
    sourceType: sourceType.value,
    applyToAll: applyToAll.value,
    objects: objects.value,
  };
  updateBlock(props.nodeId, props.block.id, newData, immediate);
};

const handleDelete = () => {
  removeBlock(props.nodeId, props.block.id);
};

const handleAddImage = () => {
  // TODO: Implement proper image upload functionality
  alert('Image upload functionality is not implemented yet.');
  // For now, let's set a placeholder image to see the preview
  imageUrl.value = `https://picsum.photos/seed/${Date.now()}/400/200`;
  updateBlockData(true); // Immediate update on new image
};

const handleSourceTypeChange = () => {
  imageUrl.value = '';
  updateBlockData(true);
}

const removeImage = () => {
  imageUrl.value = '';
  updateBlockData(true); // Immediate update on image removal
};

const handleSaveObjects = (newObjects) => {
  objects.value = newObjects;
  updateBlockData(true);
};

const openObjectModal = () => {
  showModal(ObjectDetectionModal, {
    imageUrl: imageUrl.value,
    initialObjects: objects.value,
    onSave: handleSaveObjects,
  });
};
</script>

<template>
  <div class="bg-base-100 border border-base-300 rounded-lg p-3 space-y-3 transition-all duration-200 ease-in-out hover:border-base-content/30">
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

    <!-- Description Field -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Description</span>
      </label>
      <input
        v-model="title"
        @blur="updateBlockData()"
        type="text"
        placeholder="Enter a description for the image"
        class="input input-bordered input-xs"
      />
    </div>

    <!-- Source Type Selection -->
    <div class="form-control">
      <label class="label">
        <span class="label-text text-xs">Source</span>
      </label>
      <select
        v-model="sourceType"
        @change="handleSourceTypeChange"
        class="select select-bordered select-xs"
      >
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
          @blur="updateBlockData()"
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
    <div v-if="imageUrl" class="preview-container relative w-full h-32 bg-base-200 rounded flex items-center justify-center overflow-hidden">
      <img
        :src="imageUrl"
        :alt="title || 'Image preview'"
        class="max-w-full max-h-full object-contain"
      />
      <!-- Action buttons on preview -->
      <div class="absolute top-1 right-1 flex flex-col gap-1">
        <button @click="openObjectModal" class="btn btn-xs btn-primary btn-outline">
          Set up object ({{ objects.length }})
        </button>
        <button @click="removeImage" class="btn btn-xs btn-circle btn-error self-end">
          <X class="w-3 h-3" />
        </button>
      </div>
    </div>
    
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

    <!-- The ObjectDetectionModal is now rendered by the ModalManager -->
  </div>
</template>

<style scoped>
/* All styles have been moved to Tailwind utility classes in the template. */
</style>