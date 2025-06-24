<script setup>
import { useModal } from '@/composables/use-modal'
import { h } from 'vue'

const { isModalActive, modalComponent, modalProps, hideModal } = useModal()

// We need to handle events passed as props (e.g., onSave)
// and the built-in @close event.
const renderModal = () => {
  if (isModalActive.value && modalComponent.value) {
    return h(modalComponent.value, {
      ...modalProps.value,
      onClose: hideModal, // Assuming all modals emit 'close'
    });
  }
  return null;
};
</script>

<template>
  <renderModal />
</template> 