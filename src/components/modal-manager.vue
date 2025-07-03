<script setup>
import { useModal } from '@/composables/use-modal'
import { h, ref, watch } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'

const { isModalActive, modalComponent, modalProps, hideModal } = useModal()

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

// Close modal when clicking outside of it
onClickOutside(target, () => {
  if (isModalActive.value) {
    attemptClose()
  }
})

// We need to handle events passed as props (e.g., onSave)
// and the built-in @close event.
const renderModal = () => {
  if (isModalActive.value && modalComponent.value) {
    return h(modalComponent.value, {
      ...modalProps.value,
      ref: modalRef, // Set the ref to the component instance
      // The 'close' event is now deprecated in favor of handleAttemptClose pattern
      // but we can leave it for backward compatibility if needed.
      onClose: hideModal,
    })
  }
  return null
}
</script>

<template>
  <renderModal />
</template> 