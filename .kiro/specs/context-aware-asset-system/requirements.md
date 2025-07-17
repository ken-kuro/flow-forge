# Requirements Document

## Introduction

The context-aware asset system transforms how assets are managed and inherited across nodes in the flow editor. Instead of blocks manually selecting assets from any setup node, the system will automatically provide context-aware asset inheritance based on the flow execution path. This system will enable blocks to inherit the most recently applied assets from earlier nodes, and filter available options based on the current context (image assets with objects/texts and LMS assets with questions).

## Requirements

### Requirement 1

**User Story:** As a flow designer, I want blocks to automatically inherit assets from their execution path context, so that I don't need to manually configure asset references for each block.

#### Acceptance Criteria

1. WHEN a node executes THEN the system SHALL inherit all assets from the most recent applied context in the execution path
2. WHEN multiple assets of the same type exist in context THEN the system SHALL use the most recently applied asset
3. WHEN a block applies a new asset THEN the system SHALL update the context for subsequent nodes in the execution path
4. IF no assets exist in the execution path THEN blocks SHALL leave asset selection empty, but provide a visual cue about that

### Requirement 2

**User Story:** As a flow designer, I want optimal cross-node asset references based on execution flow, so that blocks only see relevant assets from their actual execution context.

#### Acceptance Criteria

1. WHEN a lecture node block needs an asset THEN the system SHALL prioritize assets from the lecture node manual selection over the execution path context over, cause it will override the previous context
2. WHEN no context assets are available THEN the system SHALL allow selection from parent setup nodes only
3. WHEN assets are inherited from context THEN the system SHALL clearly indicate the source of the inherited assets
4. WHEN user attempt to change a execution path that might change the context THEN the system SHALL prompt the user to confirm the change
5. IF the execution path changes THEN the system SHALL automatically update asset references for affected blocks

### Requirement 3

**User Story:** As a flow designer, I want context inheritance to work reactively through connected nodes, so that changes in one node automatically propagate to dependent nodes.

#### Acceptance Criteria

1. WHEN an asset is applied in a node THEN all subsequent nodes in the execution path SHALL inherit that asset context
2. WHEN an asset is removed from context THEN subsequent nodes SHALL update their available options accordingly
3. WHEN a node's outgoing connection changes THEN the system SHALL recalculate context inheritance for all affected downstream nodes
4. IF a node has multiple incoming edges THEN the system SHALL merge contexts from all incoming paths
5. WHEN context changes THEN the system SHALL trigger reactive updates in all dependent blocks

### Requirement 4

**User Story:** As a flow designer, I want collect user data blocks to filter method options based on LMS asset types in context, so that only relevant data collection methods are available.

#### Acceptance Criteria

1. WHEN a collect user data block has LMS practice assets in context THEN the system SHALL filter methods to show only practice-compatible options
2. WHEN a collect user data block has LMS dialogue assets in context THEN the system SHALL filter methods to show only dialogue-compatible options
3. WHEN no LMS assets exist in context THEN the system SHALL show none available method options
4. WHEN LMS asset type changes in context THEN the system SHALL automatically update available method options
5. IF multiple LMS assets exist in context THEN the system SHALL use the most recently applied LMS asset for filtering

### Requirement 5

**User Story:** As a flow designer, I want system action blocks to filter available actions and targets based on current asset types in context, so that only relevant actions are presented.

#### Acceptance Criteria

1. WHEN a system action block has image assets with elements in context THEN the system SHALL show highlight actions and populate object/text IDs as targets
2. WHEN a system action block has LMS assets in context THEN the system SHALL show LMS-compatible actions
3. WHEN action type is selected THEN the system SHALL filter target options based on the selected action and available context assets
4. WHEN context assets change THEN the system SHALL update available actions and targets accordingly
5. IF no relevant assets exist in context THEN the system SHALL disable incompatible actions

### Requirement 6

**User Story:** As a flow designer, I want condition branch blocks to offer condition expressions based on LMS/question types in current context, so that conditions are relevant to the available data.

#### Acceptance Criteria

1. WHEN a condition branch has LMS practice assets in context THEN the system SHALL offer practice-specific condition expressions
2. WHEN a condition branch has LMS dialogue assets in context THEN the system SHALL offer dialogue-specific condition expressions
3. WHEN question types are available in context THEN the system SHALL include question-specific condition options
4. WHEN context changes THEN the system SHALL update available condition expressions
5. IF no LMS assets exist in context THEN the system SHALL show generic condition expressions

### Requirement 7

**User Story:** As a flow designer, I want reference management with warnings and cleanup when assets are deleted, so that I can maintain flow integrity.

#### Acceptance Criteria

1. WHEN an asset is deleted THEN the system SHALL identify all blocks/nodes that reference the asset
2. WHEN asset deletion affects existing references THEN the system SHALL show warnings listing all affected blocks/nodes
3. WHEN user confirms asset deletion THEN the system SHALL clean up all references and reset dependent blocks
4. WHEN context changes affect block behavior THEN the system SHALL reset dependent blocks to default states
5. IF asset deletion would break critical functionality THEN the system SHALL require explicit user confirmation

### Requirement 8

**User Story:** As a flow designer, I want the context system to respect the linear execution flow rules, so that context inheritance works predictably within the existing flow constraints.

#### Acceptance Criteria

1. WHEN processing context inheritance THEN the system SHALL follow the linear execution path (max 1 outgoing edge per node except conditions)
2. WHEN encountering condition nodes THEN the system SHALL handle multiple branches without creating cycles
3. WHEN validating flow structure THEN the system SHALL ensure no cycles exist in the execution path
4. WHEN calculating context THEN the system SHALL only consider connected nodes in the execution path
5. IF orphaned or dangling nodes exist THEN the system SHALL exclude them from context calculations

### Requirement 9

**User Story:** As a flow designer, I want multiple blocks within a node to execute concurrently while sharing the same inherited context, so that block behavior is consistent within each node.

#### Acceptance Criteria

1. WHEN multiple blocks exist in a node THEN all blocks SHALL share the same inherited context
2. WHEN a block within a node applies an asset THEN the applied asset SHALL be available to other blocks in the same node
3. WHEN blocks execute concurrently THEN context updates SHALL be atomic per node
4. WHEN node execution completes THEN the final context SHALL propagate to subsequent nodes
5. IF blocks within a node conflict on asset application THEN the system SHALL use the last applied asset
