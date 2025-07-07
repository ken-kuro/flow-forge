import { ref, shallowRef } from 'vue'

// This is a singleton state, shared across all components that use this composable.
const isModalActive = ref(false)
const modalComponent = shallowRef(null)
const modalProps = ref({})
const modalConfig = ref({
  size: 'md',
  height: 'auto',
  showCloseButton: true,
  bodyPadding: true
})

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
   * @param {Object} config - Configuration for the modal appearance (size, height, etc.)
   * @param {String} config.size - Modal size: 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full', or 'custom'
   * @param {String} config.customWidth - Custom width when size is 'custom'
   * @param {String} config.height - Modal height: 'auto', 'full', or 'custom'
   * @param {String} config.customHeight - Custom height when height is 'custom'
   * @param {Boolean} config.showCloseButton - Whether to show the close button
   * @param {Boolean} config.bodyPadding - Whether to add padding to the modal body
   */
  const showModal = (component, props = {}, config = {}) => {
    modalComponent.value = component
    modalProps.value = props
    modalConfig.value = { ...modalConfig.value, ...config }
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
    // Reset modal config to defaults
    modalConfig.value = {
      size: 'md',
      height: 'auto',
      showCloseButton: true,
      bodyPadding: true
    }
  }

  return {
    isModalActive,
    modalComponent,
    modalProps,
    modalConfig,
    showModal,
    hideModal,
  }
} 