<script setup>
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  imageUrl: String,
  initialObjects: {
    type: Array,
    default: () => [],
  },
  onSave: Function,
  onClose: Function,
});

const objects = ref([]);
const imageRef = ref(null);
const isDrawing = ref(false);
const newRect = ref(null);

// When the modal is shown, props will be passed. We watch `initialObjects` to populate our local state.
watch(() => props.initialObjects, (newVal) => {
  objects.value = JSON.parse(JSON.stringify(newVal || []));
}, { immediate: true, deep: true });

const closeModal = () => {
  if (props.onClose) {
    props.onClose();
  }
};

const saveObjects = () => {
  if (props.onSave) {
    props.onSave(objects.value);
  }
  closeModal();
};

const removeObject = (index) => {
  objects.value.splice(index, 1);
};

const getEventPosition = (event) => {
  if (event.touches) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
};

const handleDrawStart = (event) => {
  if (!imageRef.value) return;
  event.preventDefault(); // Prevent text selection and scrolling on touch
  isDrawing.value = true;
  const bounds = imageRef.value.getBoundingClientRect();
  const { x, y } = getEventPosition(event);
  const startX = x - bounds.left;
  const startY = y - bounds.top;
  newRect.value = { x: startX, y: startY, width: 0, height: 0 };
};

const handleDrawMove = (event) => {
  if (!isDrawing.value || !newRect.value) return;
  event.preventDefault();
  const bounds = imageRef.value.getBoundingClientRect();
  const { x, y } = getEventPosition(event);
  newRect.value.width = (x - bounds.left) - newRect.value.x;
  newRect.value.height = (y - bounds.top) - newRect.value.y;
};

const handleDrawEnd = (event) => {
  if (!isDrawing.value) return;
  event.preventDefault();
  
  if (newRect.value && newRect.value.width > 5 && newRect.value.height > 5) {
    objects.value.push({
      id: objects.value.length + 1,
      name: `Object ${objects.value.length + 1}`,
      isMain: false,
      rect: { ...newRect.value },
    });
  }
  isDrawing.value = false;
  newRect.value = null;
};
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box w-11/12 max-w-7xl h-[90vh] p-0 flex flex-col">
      <!-- Modal Header -->
      <div class="flex justify-between items-center p-6 pb-4 border-b border-base-300">
        <h3 class="font-bold text-lg">Set up object</h3>
        <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost">
          <X class="w-4 h-4" />
        </button>
      </div>
      
      <!-- Modal Body - Two Column Layout -->
      <div class="flex-1 flex gap-0 min-h-0">
        <!-- Left Column - Objects Panel -->
        <div class="w-80 flex-shrink-0 flex flex-col p-6 border-r border-base-300">
          <h4 class="font-semibold text-base mb-4">Marked objects</h4>
          <div class="flex-1 min-h-0">
            <div v-if="objects.length === 0" class="text-sm text-base-content/50 text-center py-8 border-2 border-dashed border-base-300 rounded-lg">
              No objects marked yet.<br>
              <span class="text-xs">Draw on the image to add objects</span>
            </div>
            <div v-else class="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
              <!-- Table -->
              <table class="table table-xs w-full">
                <thead class="bg-base-200">
                  <tr>
                    <th class="text-center w-12">#</th>
                    <th class="text-center w-16">Main</th>
                    <th>Name</th>
                    <th class="w-12"></th>
                  </tr>
                </thead>
                <tbody class="max-h-80 overflow-y-auto">
                  <tr v-for="(obj, index) in objects" :key="index" class="hover:bg-base-50">
                    <!-- Index -->
                    <td class="text-center">
                      <div class="badge badge-error badge-sm font-medium">
                        {{ index + 1 }}
                      </div>
                    </td>
                    
                    <!-- Main Checkbox -->
                    <td class="text-center">
                      <input type="checkbox" v-model="obj.isMain" class="checkbox checkbox-xs checkbox-primary" />
                    </td>
                    
                    <!-- Name Input -->
                    <td>
                      <input 
                        type="text" 
                        v-model="obj.name" 
                        placeholder="Object name" 
                        class="input input-xs input-bordered w-full" 
                      />
                    </td>
                    
                    <!-- Remove Button -->
                    <td class="text-center">
                      <button 
                        @click="removeObject(index)" 
                        class="btn btn-xs btn-circle btn-ghost text-error hover:bg-error hover:text-error-content"
                        title="Remove object"
                      >
                        <X class="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <!-- Right Column - Image Panel -->
        <div class="flex-1 flex flex-col p-6">
          <p class="text-sm text-base-content/70 mb-4">Click/Tap and drag on the image to create a bounding box.</p>
          <div class="flex-1 bg-base-200 rounded-lg p-4 flex items-center justify-center min-h-0 overflow-hidden">
            <div
              class="relative cursor-crosshair select-none max-w-full max-h-full"
              ref="imageContainer"
              @mousedown="handleDrawStart"
              @mousemove="handleDrawMove"
              @mouseup="handleDrawEnd"
              @mouseleave="handleDrawEnd"
              @touchstart="handleDrawStart"
              @touchmove="handleDrawMove"
              @touchend="handleDrawEnd"
              @dragstart.prevent
              style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; touch-action: none;"
            >
              <img 
                ref="imageRef" 
                :src="imageUrl" 
                alt="Object detection" 
                class="select-none pointer-events-none object-contain max-w-full max-h-full block" 
                style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;"
                draggable="false"
              />
              <!-- Existing objects -->
              <div v-for="(obj, index) in objects" :key="`obj-${index}`" 
                   class="absolute border-2 border-error box-border select-none" 
                   :style="{ 
                     left: `${obj.rect.x}px`, 
                     top: `${obj.rect.y}px`, 
                     width: `${obj.rect.width}px`, 
                     height: `${obj.rect.height}px` 
                   }">
                <span class="absolute -top-1.5 -left-1.5 bg-error text-error-content text-xs px-1.5 py-0.5 rounded font-medium min-w-[1.5rem] text-center select-none">
                  {{ index + 1 }}
                </span>
              </div>
              <!-- New drawing rect -->
              <div v-if="isDrawing && newRect" 
                   class="absolute border-2 border-error box-border border-dashed select-none" 
                   :style="{ 
                     left: `${newRect.x}px`, 
                     top: `${newRect.y}px`, 
                     width: `${newRect.width}px`, 
                     height: `${newRect.height}px` 
                   }">
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Actions -->
      <div class="border-t border-base-300 p-6 pt-4 flex-shrink-0">
        <div class="flex justify-end gap-3">
          <button @click="saveObjects" class="btn btn-primary">Save Objects</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Prevent text selection during dragging */
.select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style> 