<script setup>
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls, ControlButton } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { storeToRefs } from "pinia";
import { useFlowStore } from "@/stores/flow-store";
import { Undo, Redo } from "lucide-vue-next";
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";

/**
 * This is the core editor view.
 * It is responsible for:
 * - Rendering the Vue Flow component and its parts (MiniMap, Controls, Background).
 * - Connecting the Vue Flow instance to the Pinia store for state management.
 * - The component listens for discrete user actions (`onNodeDragStop`, `onConnect`) to save the state for undo/redo.
 */

// --- Pinia Store ---
const flowStore = useFlowStore();
const { nodes, edges } = storeToRefs(flowStore);

// --- Vue Flow Event Hooks ---
// `useVueFlow` provides the context-aware hooks. Called with no parameters, it will
// automatically connect to the parent `VueFlow` component.
const { onConnect } = useVueFlow();

// Wire the event hooks to the store's actions
onConnect(flowStore.onConnect);

/**
 * A simple validation function that allows all connections.
 * This prevents Vue Flow's default behavior of replacing existing connections on a handle.
 * @returns {boolean}
 */
const isValidConnection = () => true;

// --- Responsive Breakpoints ---
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller("md");
</script>

<template>
    <div class="editor-container w-full h-full bg-base-300">
        <!-- Small screen warning -->
        <div v-if="isMobile" class="hero h-full bg-base-200">
            <div class="hero-content text-center">
                <div class="max-w-md">
                    <h1 class="text-3xl font-bold">
                        Editor Not Available on Mobile
                    </h1>
                    <p class="py-6">
                        Please use a tablet or desktop device to create and edit
                        flows.
                    </p>
                </div>
            </div>
        </div>

        <!-- VueFlow Editor -->
        <VueFlow
            v-else
            v-model:nodes="nodes"
            v-model:edges="edges"
            :is-valid-connection="isValidConnection"
            :nodes-draggable="true"
            :pan-on-scroll="true"
            fit-view-on-init
            class="vue-flow-instance"
        >
            <Background />
            <MiniMap />

            <Controls>
                <ControlButton title="Undo" @click="flowStore.undo()">
                    <Undo />
                </ControlButton>
                <ControlButton title="Redo" @click="flowStore.redo()">
                    <Redo />
                </ControlButton>
            </Controls>
        </VueFlow>
    </div>
</template>
