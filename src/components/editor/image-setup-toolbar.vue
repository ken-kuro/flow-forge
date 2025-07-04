<script setup>
import { RectangleHorizontal, Circle, Type } from 'lucide-vue-next';

const activeTool = defineModel('activeTool');
</script>

<template>
  <div class="bg-base-100 border border-base-300 rounded-lg p-1 flex items-center gap-1">
    <button
      @click="activeTool = 'rectangle'"
      :class="['btn btn-sm btn-ghost', { 'btn-active': activeTool === 'rectangle' }]"
      title="Draw Rectangle"
    >
      <RectangleHorizontal class="w-5 h-5" />
    </button>
    <button
      @click="activeTool = 'ellipse'"
      :class="['btn btn-sm btn-ghost', { 'btn-active': activeTool === 'ellipse' }]"
      title="Draw Ellipse"
    >
      <Circle class="w-5 h-5" />
    </button>
    <button
      @click="activeTool = 'text'"
      :class="['btn btn-sm btn-ghost', { 'btn-active': activeTool === 'text' }]"
      title="Add Text"
    >
      <Type class="w-5 h-5" />
    </button>
  </div>
</template> 