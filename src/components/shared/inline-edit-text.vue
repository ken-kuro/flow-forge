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
  <div class="inline-edit-container">
    <span
      v-if="!isEditing"
      @click="startEditing"
      class="cursor-pointer hover:bg-base-200 rounded px-1 -mx-1"
      :class="{ 'text-base-content/50 italic': !localValue }"
    >
      {{ localValue || placeholder }}
    </span>
    <input
      v-else
      ref="inputRef"
      v-model="localValue"
      @blur="finishEditing"
      @keydown.enter="finishEditing"
      @keydown.esc="finishEditing"
      type="text"
      class="bg-transparent focus:bg-base-200 rounded px-1 -mx-1 outline-none"
    />
  </div>
</template> 