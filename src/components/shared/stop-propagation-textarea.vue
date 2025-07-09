<script setup>
/**
 * StopPropagationTextArea - A textarea component that prevents event bubbling
 *
 * This component wraps a textarea with consistent event handling to prevent
 * wheel, mouse, and click events from bubbling up to parent components.
 * This is particularly useful in flow editor contexts where interactions
 * should be isolated to the active component.
 */
import { ref } from 'vue'

defineProps({
    /**
     * Placeholder text for the textarea
     */
    placeholder: {
        type: String,
        default: '',
    },
    /**
     * Additional CSS classes to apply to the textarea
     */
    class: {
        type: String,
        default: '',
    },
    /**
     * Number of rows for the textarea
     */
    rows: {
        type: [String, Number],
        default: undefined,
    },
    /**
     * Whether to apply default styling (border, padding, etc.)
     * Set to false for custom styling scenarios like inline-edit-text
     */
    useDefaultStyles: {
        type: Boolean,
        default: true,
    },
})

// Modern Vue 3.4+ defineModel for v-model support
const model = defineModel({
    type: String,
    required: true,
})

// Define emits for blur event (commonly used for saving data)
const emit = defineEmits(['blur', 'focus', 'input'])

// Template ref for the textarea element
const textareaRef = ref(null)

function handleBlur(event) {
    emit('blur', event)
}

function handleFocus(event) {
    emit('focus', event)
}

function handleInput(event) {
    emit('input', event)
}

// Expose focus method for parent components
defineExpose({
    focus: () => textareaRef.value?.focus(),
    $el: textareaRef,
})
</script>

<template>
    <textarea
        ref="textareaRef"
        v-model="model"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
        @wheel.stop
        @mousedown.stop
        @mouseup.stop
        @click.stop
        :placeholder="placeholder"
        :rows="rows"
        :class="[useDefaultStyles ? 'textarea textarea-bordered textarea-xs min-h-18' : '', $props.class]"
    ></textarea>
</template>
