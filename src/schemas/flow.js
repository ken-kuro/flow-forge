/**
 * @fileoverview Flow schema definitions for the Enhanced Flow Management System
 */

/**
 * Flow schema - template instance with specific data
 * @typedef {Object} Flow
 * @property {string} id - Unique flow identifier
 * @property {string} setupId - Parent setup ID
 * @property {string} groupId - Parent group ID within setup
 * @property {string} templateId - Reference to original template
 * @property {string} templateName - Snapshot of template name
 * @property {string} instanceId - Unique identifier for this template instance
 * @property {Object} blocks - Flow-specific block data
 * @property {Object} metadata - Additional flow metadata
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * Creates a new flow object with default values
 * @param {Object} flowData - Flow configuration
 * @returns {Flow} Formatted flow object
 */
export function createFlow(flowData) {
    const now = new Date().toISOString()

    return {
        id: flowData.id,
        setupId: flowData.setupId,
        groupId: flowData.groupId,
        templateId: flowData.templateId,
        templateName: flowData.templateName,
        instanceId: flowData.instanceId,
        blocks: flowData.blocks || {},
        metadata: flowData.metadata || {},
        createdAt: flowData.createdAt || now,
        updatedAt: now,
        ...flowData,
    }
}

/**
 * Validates flow structure
 * @param {Flow} flow - Flow to validate
 * @returns {Object} Validation result with success flag and errors
 */
export function validateFlow(flow) {
    const errors = []

    if (!flow.id) errors.push('Flow ID is required')
    if (!flow.setupId) errors.push('Flow setupId is required')
    if (!flow.groupId) errors.push('Flow groupId is required')
    if (!flow.templateId) errors.push('Flow templateId is required')
    if (!flow.instanceId) errors.push('Flow instanceId is required')
    if (typeof flow.blocks !== 'object') errors.push('Flow blocks must be an object')

    return {
        success: errors.length === 0,
        errors,
    }
}

/**
 * Updates flow block data
 * @param {Flow} flow - Flow to modify
 * @param {string} blockKey - Block identifier
 * @param {Object} blockData - New block data
 * @returns {Flow} Updated flow
 */
export function updateFlowBlock(flow, blockKey, blockData) {
    return {
        ...flow,
        blocks: {
            ...flow.blocks,
            [blockKey]: {
                ...flow.blocks[blockKey],
                ...blockData,
            },
        },
        updatedAt: new Date().toISOString(),
    }
}

/**
 * Validates flow data against template structure
 * @param {Flow} flow - Flow to validate
 * @param {Object} template - Template to validate against
 * @returns {Object} Validation result with success flag and errors
 */
export function validateFlowAgainstTemplate(flow, template) {
    const errors = []

    if (!template) {
        errors.push('Template not found')
        return { success: false, errors }
    }

    // Validate that flow maintains template structure
    // This is a basic validation - can be extended based on specific requirements
    if (flow.templateId !== template.id) {
        errors.push('Flow templateId does not match template')
    }

    return {
        success: errors.length === 0,
        errors,
    }
}
