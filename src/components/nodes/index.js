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
import ConditionBranchNode from './condition/condition-branch-node.vue'

// TODO: Make sure this will be used consistently across the project, no magic strings.
export const nodeTypes = {
  'custom-start': markRaw(StartNode),
  'custom-end': markRaw(EndNode),
  'custom-setup': markRaw(SetupNode),
  'custom-lecture': markRaw(LectureNode),
  'custom-condition': markRaw(ConditionNode),
  'condition-branch': markRaw(ConditionBranchNode),
}; 