<script setup>
import { ref, onUnmounted, computed } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { Database } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'

/**
 * CollectUserDataBlock - A block for collecting user data in Lecture nodes.
 * Allows configuration of data collection methods and options.
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
     * @type {{id: string, type: string, data: {title: string, collectionTypes: string[], prompt: string, variableName: string, showSummary: boolean}}}
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
const title = ref(props.block.data.title ?? 'Collect User Data')
const methods = ref(props.block.data.method || [])
const saveToField = ref(props.block.data.saveToField ?? '')

// Available collection methods (multiple choice)
const availableMethods = [
    { value: 'voice', label: 'Voice' },
    { value: 'choose-answer', label: 'Choose Answer' },
    { value: 'text-input', label: 'Text Input' },
]

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        saveToField: saveToField.value,
        method: methods.value,
    }
    updateBlock(props.nodeId, props.block.id, newData, immediate)
}

// Handle method selection (multiple choice)
const toggleMethod = (methodValue) => {
    const index = methods.value.indexOf(methodValue)
    if (index > -1) {
        methods.value.splice(index, 1)
    } else {
        methods.value.push(methodValue)
    }
    updateBlockData(true)
}

const isMethodSelected = (method) => {
    return methods.value.includes(method)
}
</script>

<template>
    <CardBlockWrapper
        v-model="title"
        :icon="Database"
        icon-color="text-warning"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter collect user data block name"
    >
        <!-- Method Selection (Multiple Choice) -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Method</span>
            </label>
            <div class="dropdown w-full">
                <div
                    tabindex="0"
                    role="button"
                    class="select select-bordered select-xs w-full flex items-center cursor-pointer"
                >
                    <span v-if="methods.length === 0" class="text-base-content/50">Select methods...</span>
                    <span v-else class="text-left">{{
                        methods.map((m) => availableMethods.find((am) => am.value === m)?.label || m).join(', ')
                    }}</span>
                </div>
                <ul
                    tabindex="0"
                    class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300"
                >
                    <li v-for="method in availableMethods" :key="method.value">
                        <label class="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded">
                            <input
                                type="checkbox"
                                :checked="isMethodSelected(method.value)"
                                @change="toggleMethod(method.value)"
                                class="checkbox checkbox-xs checkbox-warning"
                            />
                            <span class="label-text text-xs">{{ method.label }}</span>
                        </label>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Save To Field -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Save to</span>
            </label>
            <input
                v-model="saveToField"
                @blur="updateBlockData"
                type="text"
                placeholder="TODO: Variable reference system"
                class="input input-bordered input-xs"
            />
            <!-- TODO: Implement variable reference similar to assets reference in asset applied block -->
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
