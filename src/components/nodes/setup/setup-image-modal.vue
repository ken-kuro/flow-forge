<script setup>
import { ref, watch, computed } from 'vue'
import { X, RectangleHorizontal, MessageSquare } from 'lucide-vue-next'
import { useMagicKeys } from '@vueuse/core'
import SetupImageToolbar from './setup-image-toolbar.vue'
import SelectionHandles from './selection-handles.vue'
import {
    DRAWING_TOOLS,
    TEXT_DISPLAY_TYPES,
    MIN_DRAWING_SIZE,
} from '@/components/nodes/setup/setup-image-modal.constants'
import { useModal } from '@/composables/use-modal'
import { generateId } from '@/utils/id-generator'

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
    initialObjects: {
        type: Array,
        default: () => [],
    },
    initialTexts: {
        type: Array,
        default: () => [],
    },
    onSave: Function,
    onClose: Function,
})

const objects = ref([])
const texts = ref([])
const imageRef = ref(null)
const isDrawing = ref(false)
const newRect = ref(null)
const activeTool = ref(DRAWING_TOOLS.RECTANGLE) // Default tool

// Selection state
const selectedObjectIndex = ref(-1)
const selectedTextIndex = ref(-1)

// Drag state
const isDragging = ref(false)
const dragMode = ref('') // 'move' or 'resize'
const dragStart = ref({ x: 0, y: 0 })
const originalRect = ref(null)
const resizeHandle = ref('') // Which resize handle is being dragged

const displayTypeIcons = {
    [TEXT_DISPLAY_TYPES.RECTANGLE]: RectangleHorizontal,
    [TEXT_DISPLAY_TYPES.BUBBLE_LEFT]: MessageSquare,
    [TEXT_DISPLAY_TYPES.BUBBLE_RIGHT]: MessageSquare, // Will be flipped in the template
}

const getIcon = (type) => {
    return displayTypeIcons[type] || RectangleHorizontal
}

// Computed style for the preview rectangle during drawing
const previewRectStyle = computed(() => {
    if (!isDrawing.value || !newRect.value) return {}

    const { x, y, width, height } = newRect.value
    const { offsetX, offsetY } = imageDisplayInfo.value

    // Handle negative dimensions (drawing from bottom-right to top-left)
    const finalLeft = width < 0 ? x + width : x
    const finalTop = height < 0 ? y + height : y
    const finalWidth = Math.abs(width)
    const finalHeight = Math.abs(height)

    return {
        left: `${finalLeft + offsetX}px`,
        top: `${finalTop + offsetY}px`,
        width: `${finalWidth}px`,
        height: `${finalHeight}px`,
        borderRadius: activeTool.value === DRAWING_TOOLS.ELLIPSE ? '50%' : '0',
    }
})

// Unified style helper for both objects and texts
const getElementStyle = (element, type = 'object') => {
    const { offsetX, offsetY } = imageDisplayInfo.value
    // Convert from natural coordinates to display coordinates
    const displayRect = naturalToDisplayCoords(element.rect)
    const baseStyle = {
        left: `${displayRect.x + offsetX}px`,
        top: `${displayRect.y + offsetY}px`,
        width: `${displayRect.width}px`,
        height: `${displayRect.height}px`,
    }

    // Add type-specific styles
    if (type === 'object') {
        return {
            ...baseStyle,
            borderRadius: element.type === DRAWING_TOOLS.ELLIPSE ? '50%' : '0',
        }
    }

    return baseStyle
}

// Style helpers
const getObjectStyle = (obj) => getElementStyle(obj, 'object')
const getTextStyle = (txt) => getElementStyle(txt, 'text')

// Create a deep copy of the initial state for change detection.
const initialDataSnapshot = ref(
    JSON.stringify({
        objects: props.initialObjects || [],
        texts: props.initialTexts || [],
    }),
)

// When the modal is shown, props will be passed. We watch the separated arrays to populate our local state.
watch(
    [() => props.initialObjects, () => props.initialTexts],
    ([newObjects, newTexts]) => {
        // Deep clone to ensure reactivity independence
        objects.value = JSON.parse(JSON.stringify(newObjects || []))
        texts.value = JSON.parse(JSON.stringify(newTexts || []))

        // Update the snapshot whenever the initial data changes.
        initialDataSnapshot.value = JSON.stringify({
            objects: newObjects || [],
            texts: newTexts || [],
        })
    },
    { immediate: true, deep: true },
)

/**
 * A computed property to check if the modal's data has changed.
 * This is our "dirty" check.
 */
const isDirty = computed(() => {
    const currentState = {
        objects: objects.value,
        texts: texts.value,
    }
    return JSON.stringify(currentState) !== initialDataSnapshot.value
})

const { hideModal } = useModal()

const closeModal = () => {
    hideModal()
}

/**
 * This method is called by the modal manager when the user attempts
 * to dismiss the modal (e.g., by pressing Escape or clicking the backdrop).
 */
const handleAttemptClose = () => {
    if (isDirty.value) {
        if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
            closeModal()
        }
    } else {
        // If there are no changes, close the modal without asking.
        closeModal()
    }
}

/**
 * Handle primary action (Save button)
 */
const handlePrimaryAction = () => {
    saveElements()
}

/**
 * Handle secondary action (Cancel button)
 */
const handleSecondaryAction = () => {
    handleAttemptClose()
}

/**
 * Keyboard shortcut handling using VueUse magic keys
 */
const { r, e, t, escape } = useMagicKeys({
    passive: false,
    onEventFired(e) {
        // Only handle shortcuts if not typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return
        }
        e.preventDefault()
    },
})

// Watch for keyboard shortcuts
watch(r, (pressed) => {
    if (pressed) activeTool.value = DRAWING_TOOLS.RECTANGLE
})

watch(e, (pressed) => {
    if (pressed) activeTool.value = DRAWING_TOOLS.ELLIPSE
})

watch(t, (pressed) => {
    if (pressed) activeTool.value = DRAWING_TOOLS.TEXT
})

watch(escape, (pressed) => {
    if (pressed) handleAttemptClose()
})

// Expose methods so the modal manager can call them via a template ref.
defineExpose({
    handleAttemptClose,
    handlePrimaryAction,
    handleSecondaryAction,
})

const saveElements = () => {
    if (props.onSave) {
        // Send separated arrays
        props.onSave({
            objects: objects.value,
            texts: texts.value,
        })
    }
    closeModal()
}

const removeObject = (index) => {
    objects.value.splice(index, 1)
}

const removeText = (index) => {
    texts.value.splice(index, 1)
}

// Selection functions
const selectObject = (index, type = 'object') => {
    selectedObjectIndex.value = type === 'object' ? index : -1
    selectedTextIndex.value = type === 'text' ? index : -1
}

const clearSelection = () => {
    selectedObjectIndex.value = -1
    selectedTextIndex.value = -1
}

// Computed property for image display information - memoized for performance
const imageDisplayInfo = computed(() => {
    if (!imageRef.value) return { offsetX: 0, offsetY: 0, scale: 1, displayedWidth: 0, displayedHeight: 0 }

    const imageElement = imageRef.value

    // Get the natural dimensions of the image
    const naturalWidth = imageElement.naturalWidth
    const naturalHeight = imageElement.naturalHeight

    // Get the container dimensions (the div that contains the image)
    const containerElement = imageElement.parentElement // This is the imageContainer div
    if (!containerElement) return { offsetX: 0, offsetY: 0, scale: 1, displayedWidth: 0, displayedHeight: 0 }

    const containerRect = containerElement.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // Calculate the displayed image dimensions (after object-contain scaling)
    const imageAspectRatio = naturalWidth / naturalHeight
    const containerAspectRatio = containerWidth / containerHeight

    let displayedWidth, displayedHeight, offsetX, offsetY

    if (imageAspectRatio > containerAspectRatio) {
        // Image is wider relative to container, so it's constrained by width
        displayedWidth = containerWidth
        displayedHeight = containerWidth / imageAspectRatio
        offsetX = 0
        offsetY = (containerHeight - displayedHeight) / 2
    } else {
        // Image is taller relative to container, so it's constrained by height
        displayedWidth = containerHeight * imageAspectRatio
        displayedHeight = containerHeight
        offsetX = (containerWidth - displayedWidth) / 2
        offsetY = 0
    }

    return {
        offsetX,
        offsetY,
        displayedWidth,
        displayedHeight,
        scale: displayedWidth / naturalWidth,
    }
})

// Mouse position helper - get position relative to the actual displayed image
const getMousePosition = (event) => {
    if (!imageRef.value) {
        console.warn('⚠️ getMousePosition called before image is ready')
        return { x: 0, y: 0 }
    }

    // Handle both mouse and touch events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX
    const clientY = event.touches ? event.touches[0].clientY : event.clientY

    // Get the container element (the div with event handlers)
    const containerElement = imageRef.value.parentElement
    if (!containerElement) {
        console.warn('⚠️ Container element not found')
        return { x: 0, y: 0 }
    }

    const containerRect = containerElement.getBoundingClientRect()
    const { offsetX, offsetY } = imageDisplayInfo.value

    // Calculate mouse position relative to the container, then subtract the image offset
    const mouseX = clientX - containerRect.left - offsetX
    const mouseY = clientY - containerRect.top - offsetY

    return {
        x: mouseX,
        y: mouseY,
    }
}

/**
 * Coordinate System Overview:
 *
 * NATURAL COORDINATES: Relative to the original image dimensions (stored in data)
 * - Independent of display scale and screen size
 * - Always consistent regardless of how the image is displayed
 * - Used for storing object/text positions in the data model
 *
 * DISPLAY COORDINATES: Relative to the currently displayed image (used for UI interactions)
 * - Scaled according to current image display size
 * - Used for mouse interactions, drawing, and visual positioning
 * - Converted from/to natural coordinates as needed
 *
 * Flow:
 * 1. User interactions → Display coordinates
 * 2. Display coordinates → Natural coordinates (for storage)
 * 3. Natural coordinates → Display coordinates (for rendering)
 */

// Coordinate conversion helpers
const displayToNaturalCoords = (displayRect) => {
    const { scale } = imageDisplayInfo.value
    return {
        x: displayRect.x / scale,
        y: displayRect.y / scale,
        width: displayRect.width / scale,
        height: displayRect.height / scale,
    }
}

const naturalToDisplayCoords = (naturalRect) => {
    const { scale } = imageDisplayInfo.value
    return {
        x: naturalRect.x * scale,
        y: naturalRect.y * scale,
        width: naturalRect.width * scale,
        height: naturalRect.height * scale,
    }
}

const handleIdMouseDown = (event, index, type = 'object') => {
    event.stopPropagation()
    event.preventDefault()

    selectObject(index, type)

    // Start drag for moving - convert to display coordinates for dragging calculations
    const targetArray = type === 'object' ? objects.value : texts.value
    originalRect.value = naturalToDisplayCoords(targetArray[index].rect)
    isDragging.value = true
    dragMode.value = 'move'
    dragStart.value = getMousePosition(event)
}

const handleResizeMouseDown = (event, index, type, handle) => {
    event.stopPropagation()
    event.preventDefault()

    selectObject(index, type)

    // Start drag for resizing - convert to display coordinates for dragging calculations
    const targetArray = type === 'object' ? objects.value : texts.value
    originalRect.value = naturalToDisplayCoords(targetArray[index].rect)
    isDragging.value = true
    dragMode.value = 'resize'
    resizeHandle.value = handle // Store which handle is being dragged
    dragStart.value = getMousePosition(event)
}

const handleDrawStart = (event) => {
    // Don't start drawing if we're dragging
    if (isDragging.value) return

    // Don't start drawing if clicking on interactive elements
    if (event.target.closest('span[data-id-tag]')) {
        return
    }

    if (!imageRef.value) return
    event.preventDefault() // Prevent text selection and scrolling on touch

    // Clear selection when starting to draw
    clearSelection()

    isDrawing.value = true
    const mousePos = getMousePosition(event)
    const displayInfo = imageDisplayInfo.value

    console.log('🎯 Draw Start:', {
        mousePos,
        displayInfo: {
            offsetX: displayInfo.offsetX,
            offsetY: displayInfo.offsetY,
            scale: displayInfo.scale,
            displayedSize: { width: displayInfo.displayedWidth, height: displayInfo.displayedHeight },
        },
        naturalSize: { width: imageRef.value.naturalWidth, height: imageRef.value.naturalHeight },
    })

    newRect.value = { x: mousePos.x, y: mousePos.y, width: 0, height: 0 }
}

const handleDrawMove = (event) => {
    if (!isDrawing.value || !newRect.value || isDragging.value) return
    event.preventDefault()
    const mousePos = getMousePosition(event)
    newRect.value.width = mousePos.x - newRect.value.x
    newRect.value.height = mousePos.y - newRect.value.y
}

// Handle drag movement
const handleDragMove = (event) => {
    if (!isDragging.value) return

    const currentPos = getMousePosition(event)
    const deltaX = currentPos.x - dragStart.value.x
    const deltaY = currentPos.y - dragStart.value.y

    const isObject = selectedObjectIndex.value >= 0
    const targetArray = isObject ? objects.value : texts.value
    const targetIndex = isObject ? selectedObjectIndex.value : selectedTextIndex.value

    if (targetIndex < 0 || !originalRect.value) return

    let newDisplayRect = null

    if (dragMode.value === 'move') {
        // Move the object from original position (in display coordinates)
        newDisplayRect = {
            x: originalRect.value.x + deltaX,
            y: originalRect.value.y + deltaY,
            width: originalRect.value.width,
            height: originalRect.value.height,
        }
    } else if (dragMode.value === 'resize') {
        // Resize the object based on which handle is being dragged (in display coordinates)
        const newRect = { ...originalRect.value }

        switch (resizeHandle.value) {
            case 'nw': // Top-left corner
                newRect.x = originalRect.value.x + deltaX
                newRect.y = originalRect.value.y + deltaY
                newRect.width = originalRect.value.width - deltaX
                newRect.height = originalRect.value.height - deltaY
                break
            case 'ne': // Top-right corner
                newRect.y = originalRect.value.y + deltaY
                newRect.width = originalRect.value.width + deltaX
                newRect.height = originalRect.value.height - deltaY
                break
            case 'sw': // Bottom-left corner
                newRect.x = originalRect.value.x + deltaX
                newRect.width = originalRect.value.width - deltaX
                newRect.height = originalRect.value.height + deltaY
                break
            case 'se': // Bottom-right corner
                newRect.width = originalRect.value.width + deltaX
                newRect.height = originalRect.value.height + deltaY
                break
        }

        // Ensure minimum size (in display coordinates)
        if (newRect.width >= MIN_DRAWING_SIZE && newRect.height >= MIN_DRAWING_SIZE) {
            newDisplayRect = newRect
        }
    }

    // Convert display coordinates back to natural coordinates before storing
    if (newDisplayRect) {
        const naturalRect = displayToNaturalCoords(newDisplayRect)
        targetArray[targetIndex].rect = naturalRect
    }
}

const handleDrawEnd = (event) => {
    if (!isDrawing.value) return
    event.preventDefault()

    // Check minimum size in display coordinates (MIN_DRAWING_SIZE is in display pixels)
    if (
        newRect.value &&
        Math.abs(newRect.value.width) > MIN_DRAWING_SIZE &&
        Math.abs(newRect.value.height) > MIN_DRAWING_SIZE
    ) {
        const { x, y, width, height } = newRect.value
        const displayRect = {
            x: width < 0 ? x + width : x,
            y: height < 0 ? y + height : y,
            width: Math.abs(width),
            height: Math.abs(height),
        }

        // Convert display coordinates to natural coordinates before storing
        const naturalRect = displayToNaturalCoords(displayRect)

        const totalItems = objects.value.length + texts.value.length
        const commonProps = {
            // id: totalItems + 1, // Note: This simple ID generation can have issues if items are deleted.
            id: generateId(),
            rect: naturalRect,
        }

        if (activeTool.value === DRAWING_TOOLS.RECTANGLE || activeTool.value === DRAWING_TOOLS.ELLIPSE) {
            const newObject = {
                ...commonProps,
                name: `Object ${objects.value.length + 1}`,
                isMain: false,
                type: activeTool.value,
            }
            objects.value.push(newObject)

            console.log('📦 Object Created:', {
                ...newObject,
                displayRect,
                naturalRect,
                scale: imageDisplayInfo.value.scale,
            })
        } else if (activeTool.value === DRAWING_TOOLS.TEXT) {
            const newText = {
                ...commonProps,
                text: 'New Text',
                type: DRAWING_TOOLS.TEXT,
                displayType: TEXT_DISPLAY_TYPES.BUBBLE_LEFT, // Default display type
            }
            texts.value.push(newText)

            console.log('📝 Text Created:', {
                ...newText,
                displayRect,
                naturalRect,
                scale: imageDisplayInfo.value.scale,
            })
        }
    }
    isDrawing.value = false
    newRect.value = null
}

// Handle drag end
const handleDragEnd = () => {
    isDragging.value = false
    dragMode.value = ''
    resizeHandle.value = ''
    originalRect.value = null
}
</script>

<template>
    <!-- Two Column Layout -->
    <div class="flex-1 flex gap-0 min-h-0">
        <!-- Left Column - Objects Panel -->
        <div class="w-96 flex-shrink-0 flex flex-col p-6 border-r border-base-300 overflow-y-auto">
            <!-- Marked Objects -->
            <div class="mb-6">
                <h4 class="font-semibold text-base mb-4">Marked objects</h4>
                <div
                    v-if="objects.length === 0"
                    class="text-sm text-base-content/50 text-center py-8 border-2 border-dashed border-base-300 rounded-lg"
                >
                    No objects marked yet.<br />
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
                                <td class="text-center">
                                    <div class="badge badge-error badge-sm font-medium">{{ index + 1 }}</div>
                                </td>
                                <td class="text-center">
                                    <input
                                        type="checkbox"
                                        v-model="obj.isMain"
                                        class="checkbox checkbox-xs checkbox-primary"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        v-model="obj.name"
                                        placeholder="Object name"
                                        class="input input-xs input-bordered w-full"
                                    />
                                </td>
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

            <!-- Pronunciation Texts -->
            <div>
                <h4 class="font-semibold text-base mb-4">Text with pronunciation</h4>
                <div
                    v-if="texts.length === 0"
                    class="text-sm text-base-content/50 text-center py-8 border-2 border-dashed border-base-300 rounded-lg"
                >
                    No text added yet.<br />
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
                                <td class="text-center">
                                    <div class="badge badge-primary badge-sm font-medium">{{ index + 1 }}</div>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        v-model="txt.text"
                                        placeholder="Enter text"
                                        class="input input-xs input-bordered w-full"
                                    />
                                </td>
                                <td class="text-center">
                                    <div class="dropdown dropdown-end dropdown-top">
                                        <label
                                            tabindex="0"
                                            class="btn btn-xs btn-primary btn-square flex justify-center items-center"
                                        >
                                            <component
                                                :is="getIcon(txt.displayType)"
                                                class="w-4 h-4"
                                                :style="{
                                                    transform:
                                                        txt.displayType === TEXT_DISPLAY_TYPES.BUBBLE_RIGHT
                                                            ? 'scaleX(-1)'
                                                            : 'none',
                                                }"
                                            />
                                        </label>
                                        <ul
                                            tabindex="0"
                                            class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 z-[100]"
                                        >
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
                                                    <MessageSquare class="w-4 h-4" style="transform: scaleX(-1)" />
                                                    Bubble Right
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <button
                                        @click="removeText(index)"
                                        class="btn btn-xs btn-circle btn-ghost text-error hover:bg-error hover:text-error-content"
                                        title="Remove text"
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
            <div class="flex justify-between items-center mb-4">
                <p class="text-sm text-base-content/70">
                    Click/Tap and drag to create bounding boxes. Use <kbd class="kbd kbd-xs">R</kbd>,
                    <kbd class="kbd kbd-xs">E</kbd>, <kbd class="kbd kbd-xs">T</kbd> to switch tools.
                </p>
                <SetupImageToolbar v-model:active-tool="activeTool" />
            </div>
            <div class="flex-1 bg-base-200 rounded-lg p-4 flex items-center justify-center min-h-0 overflow-hidden">
                <div
                    class="relative cursor-crosshair select-none w-full h-full max-w-full max-h-full flex items-center justify-center"
                    ref="imageContainer"
                    @mousedown="handleDrawStart"
                    @mousemove="
                        (event) => {
                            handleDrawMove(event)
                            handleDragMove(event)
                        }
                    "
                    @mouseup="
                        (event) => {
                            handleDrawEnd(event)
                            handleDragEnd()
                        }
                    "
                    @mouseleave="
                        (event) => {
                            handleDrawEnd(event)
                            handleDragEnd()
                        }
                    "
                    @touchstart="handleDrawStart"
                    @touchmove="
                        (event) => {
                            handleDrawMove(event)
                            handleDragMove(event)
                        }
                    "
                    @touchend="
                        (event) => {
                            handleDrawEnd(event)
                            handleDragEnd()
                        }
                    "
                    @dragstart.prevent
                    style="
                        user-select: none;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                        touch-action: none;
                    "
                >
                    <img
                        ref="imageRef"
                        :src="imageUrl"
                        alt="Object detection"
                        class="select-none pointer-events-none object-contain max-w-full max-h-full block"
                        style="
                            user-select: none;
                            -webkit-user-select: none;
                            -moz-user-select: none;
                            -ms-user-select: none;
                        "
                        draggable="false"
                    />
                    <!-- Existing objects -->
                    <div
                        v-for="(obj, index) in objects"
                        :key="`obj-${index}`"
                        class="absolute border-2 box-border select-none pointer-events-none"
                        :class="{
                            'border-error': selectedObjectIndex !== index,
                            'border-purple-500 border-4': selectedObjectIndex === index,
                        }"
                        :style="getObjectStyle(obj)"
                    >
                        <SelectionHandles
                            :is-selected="selectedObjectIndex === index"
                            :index="index"
                            type="object"
                            @mousedown-id="handleIdMouseDown($event, index, 'object')"
                            @mousedown-resize="(event, handle) => handleResizeMouseDown(event, index, 'object', handle)"
                        />
                    </div>
                    <!-- Existing texts -->
                    <div
                        v-for="(txt, index) in texts"
                        :key="`txt-${index}`"
                        class="absolute box-border select-none pointer-events-none p-1 flex items-center justify-center"
                        :class="{
                            'outline-4 outline-purple-500': selectedTextIndex === index,
                        }"
                        :style="getTextStyle(txt)"
                    >
                        <SelectionHandles
                            :is-selected="selectedTextIndex === index"
                            :index="index"
                            type="text"
                            @mousedown-id="handleIdMouseDown($event, index, 'text')"
                            @mousedown-resize="(event, handle) => handleResizeMouseDown(event, index, 'text', handle)"
                        />
                        <div
                            class="w-full h-full flex items-center justify-center text-center p-2"
                            :class="{
                                'bubble-left': txt.displayType === TEXT_DISPLAY_TYPES.BUBBLE_LEFT,
                                'bubble-right': txt.displayType === TEXT_DISPLAY_TYPES.BUBBLE_RIGHT,
                                'bg-base-100/80 border-2 border-primary': txt.displayType === DRAWING_TOOLS.RECTANGLE,
                            }"
                        >
                            <span class="text-base-content text-sm">
                                {{ txt.text }}
                            </span>
                        </div>
                    </div>
                    <!-- New drawing rect -->
                    <div
                        v-if="isDrawing && newRect"
                        class="absolute border-2 border-dashed box-border select-none"
                        :class="{
                            'border-error':
                                activeTool === DRAWING_TOOLS.RECTANGLE || activeTool === DRAWING_TOOLS.ELLIPSE,
                            'border-primary': activeTool === DRAWING_TOOLS.TEXT,
                        }"
                        :style="previewRectStyle"
                    ></div>
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
    border-radius: 0.4em;
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
