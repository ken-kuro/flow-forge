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
import LectureNode from './lecture/lecture-node.vue'
import ConditionNode from './condition/condition-node.vue'
import { NODE_TYPES } from '@/utils/constants';

// The nodeTypes object maps a string key to a Vue component.
// This is used by Vue Flow to know which component to render for a given node type.
export const nodeTypes = {
  [NODE_TYPES.START]: markRaw(StartNode),
  [NODE_TYPES.END]: markRaw(EndNode),
  [NODE_TYPES.SETUP]: markRaw(SetupNode),
  [NODE_TYPES.LECTURE]: markRaw(LectureNode),
  [NODE_TYPES.CONDITION]: markRaw(ConditionNode),
}; 