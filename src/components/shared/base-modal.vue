<script setup>
import { X } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps({
  /**
   * Modal size preset
   * - xs: Extra small modal (400px)
   * - sm: Small modal (500px)
   * - md: Medium modal (640px)
   * - lg: Large modal (768px)
   * - xl: Extra large modal (1024px)
   * - 2xl: 2X large modal (1280px)
   * - full: Full width modal (90vw with max-width 1536px)
   * - custom: Custom width (requires customWidth prop)
   */
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full', 'custom'].includes(value)
  },
  
  /**
   * Custom width for the modal when size is set to 'custom'
   * Can be any valid CSS width value (e.g., '800px', '50vw', etc.)
   */
  customWidth: {
    type: String,
    default: null
  },
  
  /**
   * Modal height preset
   * - auto: Content-based height
   * - full: Full height modal (90vh)
   * - custom: Custom height (requires customHeight prop)
   */
  height: {
    type: String,
    default: 'auto',
    validator: (value) => ['auto', 'full', 'custom'].includes(value)
  },
  
  /**
   * Custom height for the modal when height is set to 'custom'
   * Can be any valid CSS height value (e.g., '600px', '70vh', etc.)
   */
  customHeight: {
    type: String,
    default: null
  },
  
  /**
   * Whether to show the close button in the top-right corner
   */
  showCloseButton: {
    type: Boolean,
    default: true
  },
  
  /**
   * Title to display in the modal header
   * If not provided, the header will not be shown unless header slot is used
   */
  title: {
    type: String,
    default: null
  },
  
  /**
   * Whether to show the footer section
   * If true, the footer will be shown with default buttons
   * If false, the footer will not be shown unless footer slot is used
   */
  showFooter: {
    type: Boolean,
    default: false
  },
  
  /**
   * Text for the primary button in the footer
   */
  primaryButtonText: {
    type: String,
    default: 'Save'
  },
  
  /**
   * Text for the secondary button in the footer
   */
  secondaryButtonText: {
    type: String,
    default: 'Cancel'
  },
  
  /**
   * Whether to disable the primary button
   */
  primaryButtonDisabled: {
    type: Boolean,
    default: false
  },
  
  /**
   * Whether to show padding in the modal body
   */
  bodyPadding: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'close',         // Emitted when the modal is closed
  'primary-click', // Emitted when the primary button is clicked
  'secondary-click' // Emitted when the secondary button is clicked
]);

// Compute modal width class based on size prop
const modalWidthClass = computed(() => {
  if (props.size === 'custom' && props.customWidth) {
    return '';
  }
  
  const sizeMap = {
    'xs': 'max-w-sm', // 384px
    'sm': 'max-w-md', // 448px
    'md': 'max-w-lg', // 512px
    'lg': 'max-w-xl', // 768px
    'xl': 'max-w-3xl', // 1024px
    '2xl': 'max-w-5xl', // 1280px
    'full': 'w-11/12 max-w-7xl' // 90% width with max-width 1536px
  };
  
  return sizeMap[props.size] || sizeMap.md;
});

// Compute modal height class based on height prop
const modalHeightClass = computed(() => {
  if (props.height === 'custom' && props.customHeight) {
    return '';
  }
  
  const heightMap = {
    'auto': '',
    'full': 'h-[90vh]'
  };
  
  return heightMap[props.height] || '';
});

// Compute modal custom styles for custom width/height
const modalCustomStyle = computed(() => {
  const style = {};
  
  if (props.size === 'custom' && props.customWidth) {
    style.width = props.customWidth;
  }
  
  if (props.height === 'custom' && props.customHeight) {
    style.height = props.customHeight;
  }
  
  return style;
});

// Handle close button click
const handleClose = () => {
  emit('close');
};

// Handle primary button click
const handlePrimaryClick = () => {
  emit('primary-click');
};

// Handle secondary button click
const handleSecondaryClick = () => {
  emit('secondary-click');
};
</script>

<template>
  <div class="modal modal-open" @click.self="handleClose">
    <div 
      class="modal-box p-0 flex flex-col" 
      :class="[modalWidthClass, modalHeightClass]" 
      :style="modalCustomStyle"
    >
      <!-- Modal Header - shown if title is provided or header slot is used -->
      <div 
        v-if="title || $slots.header" 
        class="flex justify-between items-center p-6 pb-4 border-b border-base-300"
      >
        <slot name="header">
          <h3 class="font-bold text-lg">{{ title }}</h3>
        </slot>
        
        <button 
          v-if="showCloseButton" 
          @click="handleClose" 
          class="btn btn-sm btn-circle btn-ghost"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
      
      <!-- Modal Body -->
      <div 
        class="flex-1 flex flex-col min-h-0 overflow-auto" 
        :class="{ 'p-6': bodyPadding }"
      >
        <slot></slot>
      </div>
      
      <!-- Modal Footer - shown if showFooter is true or footer slot is used -->
      <div 
        v-if="showFooter || $slots.footer" 
        class="border-t border-base-300 p-6 pt-4 flex-shrink-0"
      >
        <slot name="footer">
          <div class="flex justify-end gap-3">
            <button 
              @click="handleSecondaryClick" 
              class="btn btn-ghost"
            >
              {{ secondaryButtonText }}
            </button>
            <button 
              @click="handlePrimaryClick" 
              class="btn btn-primary"
              :disabled="primaryButtonDisabled"
            >
              {{ primaryButtonText }}
            </button>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template> 