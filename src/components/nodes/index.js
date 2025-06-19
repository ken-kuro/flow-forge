/**
 * Node Types Registry for Vue Flow
 * 
 * This is the ONLY export from this directory.
 * Usage: import { nodeTypes } from '@/components/nodes'
 * 
 * For individual components, use direct imports:
 * - import StartNode from '@/components/nodes/start-node.vue'
 * - import EndNode from '@/components/nodes/end-node.vue'
 * - import SetupNode from '@/components/nodes/setup/setup-node.vue'
 */

import { markRaw } from 'vue';
import StartNode from './start-node.vue';
import EndNode from './end-node.vue';
import SetupNode from './setup/setup-node.vue';

export const nodeTypes = {
  'custom-start': markRaw(StartNode),
  'custom-end': markRaw(EndNode),
  'custom-setup': markRaw(SetupNode),
}; 