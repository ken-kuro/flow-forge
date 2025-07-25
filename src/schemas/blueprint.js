/**
 * @fileoverview Blueprint schema definitions for the Enhanced Flow Management System
 */

/**
 * Blueprint schema - defines structural compositions of templates from section groups
 * @typedef {Object} Blueprint
 * @property {string} id - Unique blueprint identifier
 * @property {string} name - Human-readable blueprint name
 * @property {string} description - Blueprint description
 * @property {string} sectionId - Associated section ID
 * @property {Array<BlueprintGroup>} groups - Group compositions with template selections
 * @property {Object} metadata - Additional blueprint metadata
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * BlueprintGroup schema - group reference with selected templates
 * @typedef {Object} BlueprintGroup
 * @property {string} groupId - Reference to group
 * @property {string} groupName - Snapshot of group name
 * @property {number} position - Position within blueprint (0-based)
 * @property {Array<BlueprintTemplate>} templates - Selected templates from group
 */

/**
 * BlueprintTemplate schema - template reference within blueprint
 * @typedef {Object} BlueprintTemplate
 * @property {string} templateId - Reference to template
 * @property {string} templateName - Snapshot of template name
 * @property {number} position - Position within group (0-based)
 * @property {boolean} isDuplicate - Whether this is a duplicate usage
 * @property {string} instanceId - Unique identifier for this template instance
 */

/**
 * Creates a new blueprint object with default values
 * @param {Object} blueprintData - Blueprint configuration
 * @returns {Blueprint} Formatted blueprint object
 */
export function createBlueprint(blueprintData) {
    const now = new Date().toISOString()

    return {
        id: blueprintData.id,
        name: blueprintData.name,
        description: blueprintData.description || '',
        sectionId: blueprintData.sectionId,
        groups: blueprintData.groups || [],
        metadata: blueprintData.metadata || {},
        createdAt: blueprintData.createdAt || now,
        updatedAt: now,
        ...blueprintData,
    }
}

/**
 * Validates blueprint structure
 * @param {Blueprint} blueprint - Blueprint to validate
 * @returns {Object} Validation result with success flag and errors
 */
export function validateBlueprint(blueprint) {
    const errors = []

    if (!blueprint.id) errors.push('Blueprint ID is required')
    if (!blueprint.name) errors.push('Blueprint name is required')
    if (!blueprint.sectionId) errors.push('Blueprint sectionId is required')
    if (!Array.isArray(blueprint.groups)) errors.push('Blueprint groups must be an array')

    // Validate each group
    blueprint.groups?.forEach((group, index) => {
        if (!group.groupId) errors.push(`Group at index ${index} missing groupId`)
        if (!group.groupName) errors.push(`Group at index ${index} missing groupName`)
        if (typeof group.position !== 'number') errors.push(`Group at index ${index} missing valid position`)
        if (!Array.isArray(group.templates)) errors.push(`Group at index ${index} templates must be an array`)

        // Validate each template in group
        group.templates?.forEach((template, templateIndex) => {
            if (!template.templateId)
                errors.push(`Template at group ${index}, template ${templateIndex} missing templateId`)
            if (!template.templateName)
                errors.push(`Template at group ${index}, template ${templateIndex} missing templateName`)
            if (typeof template.position !== 'number')
                errors.push(`Template at group ${index}, template ${templateIndex} missing valid position`)
            if (!template.instanceId)
                errors.push(`Template at group ${index}, template ${templateIndex} missing instanceId`)
        })
    })

    return {
        success: errors.length === 0,
        errors,
    }
}

/**
 * Adds a group to a blueprint
 * @param {Blueprint} blueprint - Blueprint to modify
 * @param {BlueprintGroup} group - Group to add
 * @returns {Blueprint} Updated blueprint
 */
export function addGroupToBlueprint(blueprint, group) {
    const groups = [...blueprint.groups]

    // Adjust positions of existing groups if needed
    groups.forEach((existingGroup) => {
        if (existingGroup.position >= group.position) {
            existingGroup.position++
        }
    })

    // Add new group
    groups.push(group)

    // Sort by position
    groups.sort((a, b) => a.position - b.position)

    return {
        ...blueprint,
        groups,
        updatedAt: new Date().toISOString(),
    }
}

/**
 * Removes a group from a blueprint
 * @param {Blueprint} blueprint - Blueprint to modify
 * @param {string} groupId - Group ID to remove
 * @returns {Blueprint} Updated blueprint
 */
export function removeGroupFromBlueprint(blueprint, groupId) {
    const groups = blueprint.groups.filter((g) => g.groupId !== groupId)

    // Reorder positions to be sequential
    groups.forEach((group, index) => {
        group.position = index
    })

    return {
        ...blueprint,
        groups,
        updatedAt: new Date().toISOString(),
    }
}
