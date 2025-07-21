<script setup>
/**
 * StopPropagationWrapper - A wrapper component that prevents event bubbling
 *
 * This component wraps any content with consistent event handling to prevent
 * wheel, mouse, and click events from bubbling up to parent components.
 * This is particularly useful in flow editor contexts where interactions
 * should be isolated to the active component.
 *
 * Usage:
 * <StopPropagationWrapper>
 *   <select>...</select>
 *   <input>...</input>
 *   <div>...</div>
 * </StopPropagationWrapper>
 */

defineProps({
    /**
     * HTML tag to use for the wrapper element
     */
    tag: {
        type: String,
        default: 'div',
    },
    /**
     * Additional CSS classes to apply to the wrapper
     */
    class: {
        type: String,
        default: '',
    },
    /**
     * Whether to stop click events (default: true)
     * Set to false if you need click events to bubble up
     */
    stopClick: {
        type: Boolean,
        default: true,
    },
    /**
     * Whether to stop wheel/scroll events (default: true)
     */
    stopWheel: {
        type: Boolean,
        default: true,
    },
    /**
     * Whether to stop mouse events (default: true)
     */
    stopMouse: {
        type: Boolean,
        default: true,
    },
})
</script>

<template>
    <component
        :is="tag"
        :class="$props.class"
        @wheel.stop="stopWheel && $event.stopPropagation()"
        @mousedown.stop="stopMouse && $event.stopPropagation()"
        @mouseup.stop="stopMouse && $event.stopPropagation()"
        @mousemove.stop="stopMouse && $event.stopPropagation()"
        @click.stop="stopClick && $event.stopPropagation()"
        @scroll.stop="stopWheel && $event.stopPropagation()"
    >
        <slot />
    </component>
</template>
