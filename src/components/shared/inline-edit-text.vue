<!--
  InlineEditText - A component that displays text and switches to textarea on click
  Supports multi-line content with consistent 2-line height limit in both modes
  
  Key CSS utilities used:
  - line-clamp-2: Truncates text to 2 lines with ellipsis (uses webkit-line-clamp)
  - whitespace-pre-wrap: Preserves whitespace and line breaks like <pre> but wraps text
  - break-all: Allows breaking long words at any character (prevents horizontal overflow)
  - max-h-12: Limits height to 48px (approximately 2 lines with leading-tight)
  - border-transparent: Invisible border that maintains layout spacing between modes
  - overflow-y-auto: Makes textarea scrollable when content exceeds max height
-->
<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: 'Enter value',
  },
});

const emit = defineEmits(['update:modelValue']);

const isEditing = ref(false);
const inputRef = ref(null);
const localValue = ref(props.modelValue);

async function startEditing() {
  isEditing.value = true;
  await nextTick();
  inputRef.value?.focus();
}

function finishEditing() {
  if (isEditing.value) {
    isEditing.value = false;
    // Only emit if the value has actually changed
    if (props.modelValue !== localValue.value) {
      emit('update:modelValue', localValue.value);
    }
  }
}
</script>

<template>
  <div class="inline-edit-container w-full">
    <!-- Display Mode: Shows text with 2-line limit and ellipsis -->
    <div
      v-if="!isEditing"
      @click="startEditing"
      class="cursor-pointer hover:bg-base-200 rounded px-1 -mx-1 w-full resize-none 
             break-all leading-tight max-h-12 border border-transparent overflow-hidden 
             whitespace-pre-wrap line-clamp-2"
      :class="{ 'text-base-content/50 italic': !localValue }"
      :title="localValue || placeholder"
    >
      {{ localValue || placeholder }}
    </div>
    <!-- Edit Mode: Textarea with same dimensions, scrollable if content exceeds 2 lines -->
    <textarea
      v-else
      ref="inputRef"
      v-model="localValue"
      @blur="finishEditing"
      @wheel.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
      class="bg-transparent focus:bg-base-200 rounded px-1 -mx-1 outline-none w-full resize-none 
             break-all leading-tight max-h-12 border border-base-content/20 overflow-y-auto"
      rows="2"
    />
  </div>
</template> 