<script setup>
import { computed, ref } from 'vue'
import { useModal } from '@/composables/use-modal'
import BaseModal from './base-modal.vue'

/**
 * TODO: PHASE 2 - Authentication Integration
 *
 * When implementing auth, enhance this component with:
 * - Add props: { context: 'guest' | 'authenticated' | 'admin' }
 * - Import: const { user, isAuthenticated } = useAuth()
 * - Pass user context to modal components: { ...modalProps.value, user, context, isAuthenticated }
 * - Add permission checks before rendering modals
 *
 * TODO: PHASE 3 - Multi-Layout Support
 *
 * For complex layouts, add: allowedModals prop, modal registry, and layout-specific configurations
 */

const { isModalActive, modalComponent, modalProps, modalConfig, hideModal } = useModal()

// Template ref for the modal component instance
const modalComponentRef = ref(null)

// Simple implementation for now - will be enhanced with context awareness later
const enhancedModalProps = computed(() => ({
    ...modalProps.value,
    // TODO: Add context, user, and permission props here when implementing auth
}))

// Handle modal close with unsaved warning check
const handleModalClose = () => {
    // Call the modal component's exposed handleAttemptClose method if it exists
    if (modalComponentRef.value?.handleAttemptClose) {
        modalComponentRef.value.handleAttemptClose()
    } else {
        // Fallback: close modal directly if no specific handler
        hideModal()
    }
}

// Handle modal button events
const handlePrimaryClick = () => {
    // Call the modal component's exposed handlePrimaryAction method if it exists
    if (modalComponentRef.value?.handlePrimaryAction) {
        modalComponentRef.value.handlePrimaryAction()
    } else {
        // Fallback: close modal if no specific handler
        hideModal()
    }
}

const handleSecondaryClick = () => {
    // Call the modal component's exposed handleSecondaryAction method if it exists
    if (modalComponentRef.value?.handleSecondaryAction) {
        modalComponentRef.value.handleSecondaryAction()
    } else {
        // Fallback: close modal if no specific handler
        hideModal()
    }
}
</script>

<template>
    <!-- 
    Teleport ensures modal renders at body level, avoiding CSS stacking context issues
    that can occur with Vue Flow nodes or other transformed elements
  -->
    <Teleport to="body">
        <BaseModal
            v-if="isModalActive && modalComponent"
            v-bind="modalConfig"
            @close="handleModalClose"
            @primary-click="handlePrimaryClick"
            @secondary-click="handleSecondaryClick"
        >
            <!-- Dynamic component rendering with enhanced props -->
            <component :is="modalComponent" ref="modalComponentRef" v-bind="enhancedModalProps" />
        </BaseModal>
    </Teleport>
</template>
