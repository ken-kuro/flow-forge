<script setup>
import { useModal } from '@/composables/use-modal'
import { h, ref, watch } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import BaseModal from '@/components/shared/base-modal.vue'

const { isModalActive, modalComponent, modalProps, modalConfig, hideModal } = useModal()

const modalRef = ref(null) // To get a reference to the modal component instance
const target = ref(null) // The element that is considered the modal content

// When the modal becomes active, set the target for onClickOutside
watch(isModalActive, (active) => {
  if (active) {
    // Need a tick to allow the modal to render
    setTimeout(() => {
      target.value = document.querySelector('.modal-box')
    }, 0)
  } else {
    target.value = null
  }
})

/**
 * Tries to close the modal, respecting the modal's internal state.
 * It will call the modal's `handleAttemptClose` method if it exists.
 */
const attemptClose = () => {
  if (modalRef.value && typeof modalRef.value.handleAttemptClose === 'function') {
    // The modal has its own logic for closing (e.g., checking for unsaved changes)
    modalRef.value.handleAttemptClose()
  } else {
    // For simple modals, just hide it directly
    hideModal()
  }
}

// Close modal on 'Escape' key press
onKeyStroke('Escape', (e) => {
  if (isModalActive.value) {
    e.preventDefault()
    attemptClose()
  }
})

// Close modal when clicking outside of it, with improved detection
onClickOutside(target, (event) => {
  // Only close if we're clicking directly on the modal backdrop (the .modal element)
  // and not on any element inside the modal or its children
  if (isModalActive.value && event.target.classList.contains('modal')) {
    attemptClose()
  }
}, {
  ignore: ['.dropdown-content'] // Ignore clicks on dropdown menus
})

// Render the modal content inside BaseModal
const renderModal = () => {
  if (!isModalActive.value || !modalComponent.value) {
    return null
  }
  
  // Create the modal content component
  const ModalContent = h(modalComponent.value, {
    ...modalProps.value,
    ref: modalRef, // Set the ref to the component instance
    // The 'close' event is now deprecated in favor of handleAttemptClose pattern
    // but we can leave it for backward compatibility if needed.
    onClose: hideModal,
  })
  
  // Create the BaseModal component with the modal content
  return h(BaseModal, {
    ...modalConfig.value,
    onClose: attemptClose,
    'onPrimary-click': () => {
      if (modalRef.value && typeof modalRef.value.handlePrimaryAction === 'function') {
        modalRef.value.handlePrimaryAction()
      }
    },
    'onSecondary-click': () => {
      if (modalRef.value && typeof modalRef.value.handleSecondaryAction === 'function') {
        modalRef.value.handleSecondaryAction()
      } else {
        attemptClose()
      }
    }
  }, {
    default: () => ModalContent,
    // Pass through any named slots from the modal content to BaseModal
    ...(modalRef.value?.$slots || {})
  })
}
</script>

<template>
  <component :is="renderModal()" />
</template> 