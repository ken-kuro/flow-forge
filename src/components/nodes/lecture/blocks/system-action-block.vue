<script setup>
import { ref, onUnmounted, computed } from 'vue'
import { useFlowEditor } from '@/composables/use-flow-editor'
import { Settings } from 'lucide-vue-next'
import CardBlockWrapper from '@/components/nodes/base/card-block-wrapper.vue'

/**
 * SystemActionBlock - A simplified block for system actions in Lecture nodes.
 * Matches the design specifications.
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
     * @type {{id: string, type: string, data: {title: string, action: string, value: string}}}
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
const title = ref(props.block.data.title ?? 'System Action')
const action = ref(props.block.data.action || 'show')
const delay = ref(props.block.data.delay ?? 0)
const methods = ref(props.block.data.method || [])
// TODO: Change this to plural and array type
const object = ref(props.block.data.object ?? '')

// TODO: Deal with these magic strings
// Available actions (extensible for future API calls, jobs, etc.)
const actionOptions = [
    { value: 'asset-interaction', label: 'Asset Interaction' },
    // Future: api-call, do-job, etc.
]

// TODO: Deal with these magic strings
// Available methods for asset interaction (multiple choice)
const availableMethods = [
    { value: 'highlight-elements', label: 'Highlight Elements' },
    { value: 'show-pronunciation-result', label: 'Show Pronunciation Result' },
]

// Update the store when values change
const updateBlockData = (immediate = false) => {
    const newData = {
        title: title.value,
        action: action.value,
        delay: delay.value,
        method: methods.value,
        object: object.value,
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
        :icon="Settings"
        icon-color="text-success"
        :node-id="nodeId"
        :block-id="block.id"
        placeholder="Enter system action block name"
    >
        <!-- Action Type -->
        <div class="form-control">
            <label class="label">
                <span class="label-text text-xs">Action Type</span>
            </label>
            <select v-model="action" @blur="updateBlockData" class="select select-bordered select-xs">
                <option v-for="option in actionOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>

        <!-- Asset Interaction Fields (show only when action is asset-interaction) -->
        <div v-if="action === 'asset-interaction'">
            <!-- Delay Field -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Delay (in seconds)</span>
                </label>
                <input
                    v-model="delay"
                    @blur="updateBlockData"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.5"
                    class="input input-bordered input-xs"
                />
            </div>

            <!-- Method Selection (Multiple Choice) -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Method view</span>
                </label>
                <div class="dropdown w-full">
                    <div
                        tabindex="0"
                        role="button"
                        class="select select-bordered select-xs w-full flex items-center cursor-pointer"
                    >
                        <span v-if="methods.length === 0" class="text-base-content/50">Select view methods...</span>
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
                                    class="checkbox checkbox-xs checkbox-success"
                                />
                                <span class="label-text text-xs">{{ method.label }}</span>
                            </label>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Object Field -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text text-xs">Object</span>
                </label>
                <input
                    v-model="object"
                    @blur="updateBlockData"
                    type="text"
                    placeholder="TODO: Object reference system"
                    class="input input-bordered input-xs"
                />
                <!-- TODO: Implement object reference similar to variable reference system -->
            </div>
        </div>
    </CardBlockWrapper>
</template>

<style scoped>
/* All styles now handled by CardBlockWrapper */
</style>
