<script setup>
// TODO: Revisit this component. The current implementation is a placeholder for handling variables.
import { ref, computed, onUnmounted } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { Variable } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'

/**
 * VariableBlock - A block for defining variables in Setup nodes.
 * Allows editing of variable name, value, and type.
 */
const props = defineProps({
    /**
     * The node ID this block belongs to.
     */
    nodeId: {
        type: String,
        required: true,
    },
    /**
     * The block data object.
     * @type {{id: string, type: string, data: {title: string, value: any, type: 'string'|'number'|'boolean'}}}
     */
    block: {
        type: Object,
        required: true,
    },
})

const { updateBlock, flushPendingSaves } = useFlowEditor()

// Flush any pending saves when component is unmounted
onUnmounted(() => {
    flushPendingSaves()
})

// Local reactive copies for editing
const title = computed({
    get: () => props.block.data.title ?? '',
    set: (val) => {
        // eslint-disable-next-line vue/no-mutating-props
        props.block.data.title = val
        updateBlockData()
    },
})
const value = ref(props.block.data.value ?? '')
const variableType = ref(props.block.data.type || 'string')

// Variable type options
const typeOptions = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
]

// Update the store when values change
const updateBlockData = (immediate = false) => {
    let processedValue = value.value

    // Convert value based on type
    if (variableType.value === 'number') {
        processedValue = Number(value.value) || 0
    } else if (variableType.value === 'boolean') {
        processedValue = value.value === 'true' || value.value === true
    }

    const newData = {
        title: title.value,
        value: processedValue,
        type: variableType.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

// Handle type change - this needs to be immediate
const handleTypeChange = () => {
    if (variableType.value === 'boolean') {
        value.value = 'false'
    } else if (variableType.value === 'number') {
        value.value = Number(value.value) || 0
    }
    updateBlockData(true)
}

// Preview the processed value
const processedValue = computed(() => {
    if (variableType.value === 'number') {
        return Number(value.value) || 0
    } else if (variableType.value === 'boolean') {
        return value.value === 'true' || value.value === true
    }
    return value.value
})
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="Variable"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter variable name"
    >
        <!-- Type Selection -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Type</span>
            </label>
            <select v-model="variableType" @change="handleTypeChange" class="select select-bordered select-xs">
                <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>

        <!-- Value Field -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Value</span>
            </label>

            <!-- String input -->
            <input
                v-if="variableType === 'string'"
                v-model="value"
                @blur="updateBlockData"
                type="text"
                placeholder="Enter text value"
                class="input input-bordered input-xs"
            />

            <!-- Number input -->
            <input
                v-else-if="variableType === 'number'"
                v-model="value"
                @blur="updateBlockData"
                type="number"
                placeholder="0"
                class="input input-bordered input-xs"
            />

            <!-- Boolean select -->
            <select
                v-else-if="variableType === 'boolean'"
                v-model="value"
                @blur="updateBlockData"
                class="select select-bordered select-xs"
            >
                <option value="false">false</option>
                <option value="true">true</option>
            </select>
        </div>

        <!-- Value Preview -->
        <div v-if="title" class="preview-container">
            <label class="label">
                <span class="label-text text-xs">Preview</span>
            </label>
            <div class="bg-base-200 rounded p-2 text-xs font-mono">
                <span class="text-accent">{{ title }}</span> =
                <span class="text-primary">{{ processedValue }}</span>
                <span class="text-base-content/50"> ({{ variableType }})</span>
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
