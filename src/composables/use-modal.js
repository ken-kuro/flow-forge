import { ref, shallowRef } from 'vue'

// This is a singleton state, shared across all components that use this composable.
const isModalActive = ref(false)
const modalComponent = shallowRef(null)
const modalProps = ref({})

/**
 * A composable for managing a global modal state.
 * This allows any component to open a modal that will be rendered at the top level of the app,
 * preventing issues with CSS stacking contexts (e.g., transforms in Vue Flow nodes).
 */
export function useModal() {
  /**
   * Shows a modal.
   * @param {Object} component - The Vue component to render as the modal.
   * @param {Object} props - The props to pass to the modal component. This can include event handlers like `onSave`.
   */
  const showModal = (component, props = {}) => {
    modalComponent.value = component
    modalProps.value = props
    isModalActive.value = true
  }

  /**
   * Hides the currently active modal.
   */
  const hideModal = () => {
    isModalActive.value = false
    // It's good practice to clear the component and props after the modal is hidden.
    modalComponent.value = null
    modalProps.value = {}
  }

  return {
    isModalActive,
    modalComponent,
    modalProps,
    showModal,
    hideModal,
  }
} 