/**
 * @fileoverview Setup schema definitions for the Enhanced Flow Management System
 */

/**
 * Setup schema - blueprint instance that can be freely modified
 * @typedef {Object} Setup
 * @property {string} id - Unique setup identifier
 * @property {string} scriptId - Parent script ID
 * @property {string} sectionId - Associated section ID
 * @property {string} sectionName - Snapshot of section name
 * @property {string} originalBlueprintId - Reference to original blueprint
 * @property {Array<SetupGroup>} groups - Group structure (can be modified)
 * @property {Object} metadata - Additional setup metadata
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * SetupGroup schema - group within setup (modifiable)
 * @typedef {Object} SetupGroup
 * @property {string} groupId - Unique group identifier within setup
 * @property {string} groupName - Snapshot of group name
 * @property {string} originalGroupId - Reference to original group
 * @property {number} position - Position within setup (0-based)
 * @property {Array<string>} flowIds - Array of flow IDs in this group
 */

/**
 * Creates a new setup object with default values
 * @param {Object} setupData - Setup configuration
 * @returns {Setup} Formatted setup object
 */
export function createSetup(setupData) {
    const now = new Date().toISOString()

    return {
        id: setupData.id,
        scriptId: setupData.scriptId,
        sectionId: setupData.sectionId,
        sectionName: setupData.sectionName,
        originalBlueprintId: setupData.originalBlueprintId,
        groups: setupData.groups || [],
        metadata: setupData.metadata || {},
        createdAt: setupData.createdAt || now,
        updatedAt: now,
        ...setupData,
    }
}

/**
 * Validates setup structure
 * @param {Setup} setup - Setup to validate
 * @returns {Object} Validation result with success flag and errors
 */
export function validateSetup(setup) {
    const errors = []

    if (!setup.id) errors.push('Setup ID is required')
    if (!setup.scriptId) errors.push('Setup scriptId is required')
    if (!setup.sectionId) errors.push('Setup sectionId is required')
    if (!setup.originalBlueprintId) errors.push('Setup originalBlueprintId is required')
    if (!Array.isArray(setup.groups)) errors.push('Setup groups must be an array')

    // Validate each group
    setup.groups?.forEach((group, index) => {
        if (!group.groupId) errors.push(`Group at index ${index} missing groupId`)
        if (!group.groupName) errors.push(`Group at index ${index} missing groupName`)
        if (!group.originalGroupId) errors.push(`Group at index ${index} missing originalGroupId`)
        if (typeof group.position !== 'number') errors.push(`Group at index ${index} missing valid position`)
        if (!Array.isArray(group.flowIds)) errors.push(`Group at index ${index} flowIds must be an array`)
    })

    return {
        success: errors.length === 0,
        errors,
    }
}

/**
 * Reorders groups in a setup
 * @param {Setup} setup - Setup to modify
 * @param {number} fromIndex - Current position
 * @param {number} toIndex - New position
 * @returns {Setup} Updated setup
 */
export function reorderGroupsInSetup(setup, fromIndex, toIndex) {
    const groups = [...setup.groups]
    const [removed] = groups.splice(fromIndex, 1)
    groups.splice(toIndex, 0, removed)

    // Update positions to match array indices
    groups.forEach((group, index) => {
        group.position = index
    })

    return {
        ...setup,
        groups,
        updatedAt: new Date().toISOString(),
    }
}

/**
 * Reorders flows within a group in a setup
 * @param {Setup} setup - Setup to modify
 * @param {string} groupId - Group ID containing the flows
 * @param {number} fromIndex - Current position
 * @param {number} toIndex - New position
 * @returns {Setup} Updated setup
 */
export function reorderFlowsInSetupGroup(setup, groupId, fromIndex, toIndex) {
    const groups = setup.groups.map((group) => {
        if (group.groupId === groupId) {
            const flowIds = [...group.flowIds]
            const [removed] = flowIds.splice(fromIndex, 1)
            flowIds.splice(toIndex, 0, removed)

            return {
                ...group,
                flowIds,
            }
        }
        return group
    })

    return {
        ...setup,
        groups,
        updatedAt: new Date().toISOString(),
    }
}

/**
 * Removes a flow from a setup group
 * @param {Setup} setup - Setup to modify
 * @param {string} groupId - Group ID containing the flow
 * @param {string} flowId - Flow ID to remove
 * @returns {Setup} Updated setup
 */
export function removeFlowFromSetupGroup(setup, groupId, flowId) {
    const groups = setup.groups.map((group) => {
        if (group.groupId === groupId) {
            return {
                ...group,
                flowIds: group.flowIds.filter((id) => id !== flowId),
            }
        }
        return group
    })

    return {
        ...setup,
        groups,
        updatedAt: new Date().toISOString(),
    }
}
