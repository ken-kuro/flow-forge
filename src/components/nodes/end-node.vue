<script setup>
import { Handle, Position } from '@vue-flow/core'
import { Square } from 'lucide-vue-next'

/**
 * EndNode - A simple, circular flow termination point.
 * Uses DaisyUI/Catppuccin theme colors for consistency.
 */

// Props from Vue Flow with improved type definition for `data`
const props = defineProps({
    data: {
        type: Object,
    },
    selected: Boolean,
})
</script>

<template>
    <div
        class="end-node w-16 h-16 flex items-center justify-center rounded-full border-2 bg-error text-error-content border-error-focus transition-all duration-200 ease-in-out"
        :class="{ 'ring-4 ring-error ring-opacity-70': selected }"
    >
        <Square class="w-6 h-6" />

        <!-- Single target handle, centered at the left - uses global styling -->
        <Handle type="target" :position="Position.Left" />
    </div>
</template>

<style scoped>
/* No handle styling needed - uses global styling from main.css */
</style>
