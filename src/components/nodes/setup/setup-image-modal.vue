<script setup>
import { ref, watch, computed, defineExpose } from 'vue';
import { X, RectangleHorizontal, MessageSquare, ChevronDown } from 'lucide-vue-next';
import SetupImageToolbar from './setup-image-toolbar.vue';
import { DRAWING_TOOLS, TEXT_DISPLAY_TYPES, MIN_DRAWING_SIZE } from '@/utils/modal-constants';

/**
 * TODO: MODAL-SPECIFIC HISTORY MANAGEMENT
 * 
 * Future enhancement to add undo/redo functionality within this modal:
 * 
 * 1. Create a reusable ModalToolbar component
 *    - Location: src/components/shared/modal-toolbar.vue
 *    - Features: Undo/Redo buttons, Save/Cancel buttons, keyboard shortcuts display
 *    - Should be modal-agnostic and accept props for button configurations
 * 
 * 2. Create a modal history store and composable
 *    - Store: src/stores/modal-history-store.js (or use a lightweight composable-only approach)
 *    - Composable: src/composables/use-modal-history.js
 *    - Features: 
 *      - Independent history stack (separate from main editor history)
 *      - pushState(), undo(), redo(), canUndo, canRedo
 *      - Keyboard shortcut handling (Ctrl+Z/Ctrl+Y within modal scope)
 *      - Auto-save state snapshots on significant changes
 * 
 * 3. Integration in this modal
 *    - Use the composable to track changes to the `objects` array
 *    - Add ModalToolbar component to the header or footer
 *    - Implement modal-scoped keyboard shortcuts that don't conflict with global ones
 * 
 * Benefits:
 *    - Users can undo/redo bounding box creation/deletion within the modal
 *    - Consistent UX pattern that can be reused in other complex modals
 *    - Isolation from main editor history prevents accidental interference
 */

const props = defineProps({
  imageUrl: String,
  initialElements: {
    type: Array,
    default: () => [],
  },
  onSave: Function,
  onClose: Function,
});

const objects = ref([]);
const texts = ref([]);
const imageRef = ref(null);
const isDrawing = ref(false);
const newRect = ref(null);
const activeTool = ref(DRAWING_TOOLS.RECTANGLE); // Default tool

const displayTypeIcons = {
  [TEXT_DISPLAY_TYPES.RECTANGLE]: RectangleHorizontal,
  [TEXT_DISPLAY_TYPES.BUBBLE_LEFT]: MessageSquare,
  [TEXT_DISPLAY_TYPES.BUBBLE_RIGHT]: MessageSquare, // Will be flipped in the template
};

const getIcon = (type) => {
  return displayTypeIcons[type] || RectangleHorizontal;
};

const previewRectStyle = computed(() => {
  if (!isDrawing.value || !newRect.value) return {};

  const { x, y, width, height } = newRect.value;

  return {
    left: (width < 0 ? x + width : x) + 'px',
    top: (height < 0 ? y + height : y) + 'px',
    width: Math.abs(width) + 'px',
    height: Math.abs(height) + 'px',
    borderRadius: activeTool.value === DRAWING_TOOLS.ELLIPSE ? '50%' : '0',
  };
});

const handleToolSelected = (tool) => {
  activeTool.value = tool;
};

// Create a deep copy of the initial state for change detection.
const initialElementsSnapshot = ref(JSON.stringify(props.initialElements || []));

// When the modal is shown, props will be passed. We watch `initialElements` to populate our local state.
watch(() => props.initialElements, (newVal) => {
  const allItems = JSON.parse(JSON.stringify(newVal || []));
  
  objects.value = allItems
    .filter(item => !item.type || item.type === DRAWING_TOOLS.RECTANGLE || item.type === DRAWING_TOOLS.ELLIPSE)
    .map(item => ({ ...item, type: item.type || DRAWING_TOOLS.RECTANGLE }));
    
  texts.value = allItems.filter(item => item.type === 'text');

  // Update the snapshot whenever the initial data changes.
  initialElementsSnapshot.value = JSON.stringify(newVal || []);
}, { immediate: true, deep: true });

/**
 * A computed property to check if the modal's data has changed.
 * This is our "dirty" check.
 */
const isDirty = computed(() => {
  const currentState = [...objects.value, ...texts.value];
  // Simple comparison. For a more robust check, we could sort both arrays by ID.
  return JSON.stringify(currentState) !== initialElementsSnapshot.value;
});

const closeModal = () => {
  if (props.onClose) {
    props.onClose();
  }
};

/**
 * This method is called by the modal manager when the user attempts
 * to dismiss the modal (e.g., by pressing Escape or clicking the backdrop).
 */
const handleAttemptClose = () => {
  if (isDirty.value) {
    if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
      closeModal();
    }
  } else {
    // If there are no changes, close the modal without asking.
    closeModal();
  }
};

/**
 * Handle primary action (Save button)
 */
const handlePrimaryAction = () => {
  saveElements();
};

/**
 * Handle secondary action (Cancel button)
 */
const handleSecondaryAction = () => {
  handleAttemptClose();
};

// Expose methods so the modal manager can call them via a template ref.
defineExpose({
  handleAttemptClose,
  handlePrimaryAction,
  handleSecondaryAction
});

const saveElements = () => {
  if (props.onSave) {
    props.onSave([...objects.value, ...texts.value]);
  }
  closeModal();
};

const removeObject = (index) => {
  objects.value.splice(index, 1);
};

const removeText = (index) => {
  texts.value.splice(index, 1);
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
  
  if (newRect.value && Math.abs(newRect.value.width) > 5 && Math.abs(newRect.value.height) > 5) {
    const { x, y, width, height } = newRect.value;
    const finalRect = {
      x: width < 0 ? x + width : x,
      y: height < 0 ? y + height : y,
      width: Math.abs(width),
      height: Math.abs(height),
    };
    
    const totalItems = objects.value.length + texts.value.length;
    const commonProps = {
      id: totalItems + 1, // Note: This simple ID generation can have issues if items are deleted.
      rect: finalRect,
    };

    if (activeTool.value === DRAWING_TOOLS.RECTANGLE || activeTool.value === DRAWING_TOOLS.ELLIPSE) {
      objects.value.push({
        ...commonProps,
        name: `Object ${objects.value.length + 1}`,
        isMain: false,
        type: activeTool.value,
      });
    } else if (activeTool.value === 'text') {
      texts.value.push({
        ...commonProps,
        text: 'New Text',
        type: 'text',
        displayType: TEXT_DISPLAY_TYPES.BUBBLE_LEFT, // Default display type
      });
    }
  }
  isDrawing.value = false;
  newRect.value = null;
};
</script>

<template>
  <!-- Two Column Layout -->
  <div class="flex-1 flex gap-0 min-h-0">
    <!-- Left Column - Objects Panel -->
    <div class="w-80 flex-shrink-0 flex flex-col p-6 border-r border-base-300 overflow-y-auto">
      <!-- Marked Objects -->
      <div class="mb-6">
        <h4 class="font-semibold text-base mb-4">Marked objects</h4>
        <div v-if="objects.length === 0" class="text-sm text-base-content/50 text-center py-8 border-2 border-dashed border-base-300 rounded-lg">
          No objects marked yet.<br>
          <span class="text-xs">Draw on the image to add objects</span>
        </div>
        <div v-else class="bg-base-100 border border-base-300 rounded-lg">
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
              <tr v-for="(obj, index) in objects" :key="`object-${index}`" class="hover:bg-base-50">
                <td class="text-center"><div class="badge badge-error badge-sm font-medium">{{ index + 1 }}</div></td>
                <td class="text-center"><input type="checkbox" v-model="obj.isMain" class="checkbox checkbox-xs checkbox-primary" /></td>
                <td><input type="text" v-model="obj.name" placeholder="Object name" class="input input-xs input-bordered w-full" /></td>
                <td class="text-center">
                  <button @click="removeObject(index)" class="btn btn-xs btn-circle btn-ghost text-error hover:bg-error hover:text-error-content" title="Remove object">
                    <X class="w-3 h-3" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pronunciation Texts -->
      <div>
        <h4 class="font-semibold text-base mb-4">Text with pronunciation</h4>
         <div v-if="texts.length === 0" class="text-sm text-base-content/50 text-center py-8 border-2 border-dashed border-base-300 rounded-lg">
          No text added yet.<br>
          <span class="text-xs">Use the Text tool to add text</span>
        </div>
        <div v-else class="bg-base-100 border border-base-300 rounded-lg">
          <table class="table table-xs w-full">
            <thead class="bg-base-200">
              <tr>
                <th class="text-center w-12">#</th>
                <th>Text</th>
                <th class="w-16 text-center">Display</th>
                <th class="w-12"></th>
              </tr>
            </thead>
            <tbody class="max-h-80 overflow-y-auto">
              <tr v-for="(txt, index) in texts" :key="`text-${index}`" class="hover:bg-base-50">
                <td class="text-center"><div class="badge badge-primary badge-sm font-medium">{{ index + 1 }}</div></td>
                <td><input type="text" v-model="txt.text" placeholder="Enter text" class="input input-xs input-bordered w-full" /></td>
                <td class="text-center">
                  <div class="dropdown dropdown-end dropdown-top">
                    <label tabindex="0" class="btn btn-xs btn-primary btn-square flex justify-center items-center">
                      <component 
                        :is="getIcon(txt.displayType)" 
                        class="w-4 h-4"
                        :style="{ transform: txt.displayType === TEXT_DISPLAY_TYPES.BUBBLE_RIGHT ? 'scaleX(-1)' : 'none' }"
                        />
                    </label>
                    <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 z-[100]">
                      <li>
                        <a @click="txt.displayType = TEXT_DISPLAY_TYPES.RECTANGLE">
                          <RectangleHorizontal class="w-4 h-4" /> Rectangle
                        </a>
                      </li>
                      <li>
                        <a @click="txt.displayType = TEXT_DISPLAY_TYPES.BUBBLE_LEFT">
                          <MessageSquare class="w-4 h-4" /> Bubble Left
                        </a>
                      </li>
                      <li>
                        <a @click="txt.displayType = TEXT_DISPLAY_TYPES.BUBBLE_RIGHT">
                          <MessageSquare class="w-4 h-4" style="transform: scaleX(-1)" /> Bubble Right
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
                <td class="text-center">
                  <button @click="removeText(index)" class="btn btn-xs btn-circle btn-ghost text-error hover:bg-error hover:text-error-content" title="Remove text">
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
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-base-content/70">Click/Tap and drag on the image to create a bounding box.</p>
        <SetupImageToolbar v-model:active-tool="activeTool" />
      </div>
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
                class="absolute border-2 border-error box-border select-none pointer-events-none" 
                :style="{ 
                  left: `${obj.rect.x}px`, 
                  top: `${obj.rect.y}px`, 
                  width: `${obj.rect.width}px`, 
                  height: `${obj.rect.height}px`,
                  borderRadius: obj.type === DRAWING_TOOLS.ELLIPSE ? '50%' : '0'
                }">
            <span class="absolute -top-1.5 -left-1.5 bg-error text-error-content text-xs px-1.5 py-0.5 rounded font-medium min-w-[1.5rem] text-center select-none">
              {{ index + 1 }}
            </span>
          </div>
          <!-- Existing texts -->
          <div v-for="(txt, index) in texts" :key="`txt-${index}`"
                class="absolute box-border select-none pointer-events-none p-1 flex items-center justify-center"
                :style="{
                  left: `${txt.rect.x}px`,
                  top: `${txt.rect.y}px`,
                  width: `${txt.rect.width}px`,
                  height: `${txt.rect.height}px`
                }">
              <span class="absolute -top-1.5 -left-1.5 bg-primary text-primary-content text-xs px-1.5 py-0.5 rounded font-medium min-w-[1.5rem] text-center select-none z-10">
              {{ index + 1 }}
            </span>
            <div 
              class="w-full h-full flex items-center justify-center text-center p-2"
              :class="{
                [TEXT_DISPLAY_TYPES.BUBBLE_LEFT]: txt.displayType === TEXT_DISPLAY_TYPES.BUBBLE_LEFT,
                [TEXT_DISPLAY_TYPES.BUBBLE_RIGHT]: txt.displayType === TEXT_DISPLAY_TYPES.BUBBLE_RIGHT,
                'bg-base-100/80 border-2 border-primary': txt.displayType === DRAWING_TOOLS.RECTANGLE
              }"
              >
              <span class="text-base-content text-sm">
                {{ txt.text }}
              </span>
            </div>
          </div>
          <!-- New drawing rect -->
          <div v-if="isDrawing && newRect"
                class="absolute border-2 border-dashed box-border select-none"
                :class="{
                  'border-error': activeTool === DRAWING_TOOLS.RECTANGLE || activeTool === DRAWING_TOOLS.ELLIPSE,
                  'border-primary': activeTool === 'text'
                }"
                :style="previewRectStyle">
          </div>
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

.bubble-left,
.bubble-right {
  position: relative;
  background: #ffffff;
  border-radius: .4em;
  border: 1px solid #570df8; /* primary color */
}

.bubble-left:after {
  content: '';
  position: absolute;
  left: 0;
  top: 1em;
  width: 0;
  height: 0;
  border: 0.7em solid transparent;
  border-right-color: #ffffff;
  border-left: 0;
  margin-top: -0.5em;
  margin-left: -0.7em;
  filter: drop-shadow(-1px 0 0 #570df8);
}

.bubble-left:before {
  content: '';
  position: absolute;
  left: 0;
  top: 1em;
  width: 0;
  height: 0;
  border: 0.75em solid transparent;
  border-right-color: #570df8; /* primary color */
  border-left: 0;
  margin-top: -0.75em;
  margin-left: -0.8em;
}

.bubble-right:after {
  content: '';
  position: absolute;
  right: 0;
  top: 1em;
  width: 0;
  height: 0;
  border: 0.7em solid transparent;
  border-left-color: #ffffff;
  border-right: 0;
  margin-top: -0.5em;
  margin-right: -0.7em;
  filter: drop-shadow(1px 0 0 #570df8);
}

.bubble-right:before {
  content: '';
  position: absolute;
  right: 0;
  top: 1em;
  width: 0;
  height: 0;
  border: 0.75em solid transparent;
  border-left-color: #570df8; /* primary color */
  border-right: 0;
  margin-top: -0.75em;
  margin-right: -0.8em;
}
</style> 