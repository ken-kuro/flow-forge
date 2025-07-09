<script setup>
import { Handle, Position } from '@vue-flow/core'
import { Play } from 'lucide-vue-next'

/**
 * StartNode - A simple, circular flow entry point.
 * Uses DaisyUI/Catppuccin theme colors for consistency.
 */

// Props from Vue Flow with improved type definition for `data`
const props = defineProps({
    /**
     * The data object for the node.
     * @type {{title: string, config: object}}
     */
    data: {
        type: Object,
        required: true,
        // Provide a default factory function for object props
        default: () => ({ title: 'Start', config: {} }),
    },
    selected: Boolean,
})
</script>

<template>
    <div
        class="start-node w-16 h-16 flex items-center justify-center rounded-full border-2 bg-success text-success-content border-success-focus transition-all duration-200 ease-in-out"
        :class="{ 'ring-4 ring-success ring-opacity-70': selected }"
    >
        <Play class="w-6 h-6" />

        <!-- Single source handle, centered at the right - uses global styling -->
        <Handle type="source" :position="Position.Right" />
    </div>
</template>

<style scoped>
/* No handle styling needed - uses global styling from main.css */
</style>
