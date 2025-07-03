<script setup>
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import FlowEditor from '@/components/flow-editor.vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useFlowEditor } from '@/composables/use-flow-editor.js'

/**
 * EditorView - The editor page/view container
 * 
 * This view is responsible for:
 * - Handling routing and page-level concerns
 * - Managing responsive behavior and mobile detection
 * - Rendering the FlowEditor component when appropriate
 * - Future: Could handle page-level toolbars, save/load UI, etc.
 */

// --- Responsive Breakpoints ---
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')

const { canUndo } = useFlowEditor()

/**
 * Warns the user about unsaved changes before they navigate away
 * to another route within the application.
 */
onBeforeRouteLeave(() => {
  if (canUndo.value) {
    const answer = window.confirm(
      'You have unsaved changes that will be lost. Are you sure you want to leave this page?'
    )
    // If the user cancels, block the navigation. Otherwise, allow it.
    if (!answer) {
      return false
    }
  }
  // No unsaved changes, allow navigation.
  return true
})
</script>

<template>
  <div class="editor-view w-full h-full">
    <!-- Mobile warning -->
    <div v-if="isMobile" class="hero h-full bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-3xl font-bold text-base-content">
            Editor Not Available on Mobile
          </h1>
          <p class="py-6 text-base-content">
            Please use a tablet or desktop device to create and edit flows.
          </p>
        </div>
      </div>
    </div>

    <!-- Desktop editor -->
    <FlowEditor v-else />
  </div>
</template>

<style scoped>
.editor-view {
  /* Page-level styles */
  /* Future: Could include page-specific layouts, toolbars, etc. */
}
</style>
