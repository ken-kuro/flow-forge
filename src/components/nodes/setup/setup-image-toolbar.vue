<script setup>
import { RectangleHorizontal, Circle, Type } from 'lucide-vue-next'

// TODO: Deal with these magic strings later
const activeTool = defineModel('activeTool')
</script>

<template>
    <div class="bg-base-100 border border-base-300 rounded-lg p-1 flex items-center gap-1">
        <button
            @click="activeTool = 'rectangle'"
            :class="['btn btn-sm btn-ghost', { 'btn-active': activeTool === 'rectangle' }]"
            title="Draw Rectangle (R)"
        >
            <RectangleHorizontal class="w-5 h-5" />
        </button>
        <button
            @click="activeTool = 'ellipse'"
            :class="['btn btn-sm btn-ghost', { 'btn-active': activeTool === 'ellipse' }]"
            title="Draw Ellipse (E)"
        >
            <Circle class="w-5 h-5" />
        </button>
        <button
            @click="activeTool = 'text'"
            :class="['btn btn-sm btn-ghost', { 'btn-active': activeTool === 'text' }]"
            title="Add Text (T)"
        >
            <Type class="w-5 h-5" />
        </button>
    </div>
</template>
