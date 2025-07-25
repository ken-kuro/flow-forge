/**
 * @fileoverview Group schema definitions for the Enhanced Flow Management System
 */

/**
 * Creates a new group object with default values
 * @param {Object} groupData - Group configuration
 * @returns {Object} Formatted group object
 */
export function createGroup(groupData) {
    const now = new Date().toISOString()

    return {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description || '',
        templates: groupData.templates || [],
        createdAt: groupData.createdAt || now,
        updatedAt: now,
        ...groupData,
    }
}

/**
 * Adds a template to a group at specified position
 * @param {Object} group - Group to modify
 * @param {string} templateId - Template ID to add
 * @param {number} position - Position in group
 * @returns {Object} Updated group
 */
export function addTemplateToGroup(group, templateId, position) {
    const templates = [...group.templates]

    // Adjust positions of existing templates if needed
    templates.forEach((template) => {
        if (template.position >= position) {
            template.position++
        }
    })

    // Add new template
    templates.push({
        templateId,
        position,
    })

    // Sort by position
    templates.sort((a, b) => a.position - b.position)

    return {
        ...group,
        templates,
        updatedAt: new Date().toISOString(),
    }
}

/**
 * Removes a template from a group
 * @param {Object} group - Group to modify
 * @param {string} templateId - Template ID to remove
 * @returns {Object} Updated group
 */
export function removeTemplateFromGroup(group, templateId) {
    const templates = group.templates.filter((t) => t.templateId !== templateId)

    // Reorder positions to be sequential
    templates.forEach((template, index) => {
        template.position = index
    })

    return {
        ...group,
        templates,
        updatedAt: new Date().toISOString(),
    }
}
