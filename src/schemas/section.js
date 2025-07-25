/**
 * @fileoverview Section schema definitions for the Enhanced Flow Management System
 */

/**
 * Section schema - represents activity types and contains groups
 * @typedef {Object} Section
 * @property {string} id - Unique section identifier
 * @property {string} name - Human-readable section name
 * @property {string} description - Section description
 * @property {Array<string>} groupIds - Array of group IDs assigned to this section
 * @property {string} activityType - Type of activities this section represents
 * @property {Object} metadata - Additional metadata about the section
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * Creates a new section object with default values
 * @param {Object} sectionData - Section configuration
 * @returns {Section} Formatted section object
 */
export function createSection(sectionData) {
    const now = new Date().toISOString()

    return {
        id: sectionData.id,
        name: sectionData.name,
        description: sectionData.description || '',
        groupIds: sectionData.groupIds || [],
        activityType: sectionData.activityType || 'general',
        metadata: sectionData.metadata || {},
        createdAt: sectionData.createdAt || now,
        updatedAt: now,
        ...sectionData,
    }
}

/**
 * Validates section structure
 * @param {Section} section - Section to validate
 * @returns {Object} Validation result with success flag and errors
 */
export function validateSection(section) {
    const errors = []

    if (!section.id) errors.push('Section ID is required')
    if (!section.name) errors.push('Section name is required')
    if (!Array.isArray(section.groupIds)) errors.push('Section groupIds must be an array')
    if (!section.activityType) errors.push('Section activityType is required')

    return {
        success: errors.length === 0,
        errors,
    }
}

/**
 * Adds a group to a section
 * @param {Section} section - Section to modify
 * @param {string} groupId - Group ID to add
 * @returns {Section} Updated section
 */
export function addGroupToSection(section, groupId) {
    if (section.groupIds.includes(groupId)) {
        return section // Already exists
    }

    return {
        ...section,
        groupIds: [...section.groupIds, groupId],
        updatedAt: new Date().toISOString(),
    }
}

/**
 * Removes a group from a section
 * @param {Section} section - Section to modify
 * @param {string} groupId - Group ID to remove
 * @returns {Section} Updated section
 */
export function removeGroupFromSection(section, groupId) {
    return {
        ...section,
        groupIds: section.groupIds.filter((id) => id !== groupId),
        updatedAt: new Date().toISOString(),
    }
}
