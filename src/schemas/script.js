/**
 * @fileoverview Script schema definitions for the Enhanced Flow Management System
 */

/**
 * Script schema - contains multiple sections for complete projects
 * @typedef {Object} Script
 * @property {string} id - Unique script identifier
 * @property {string} name - Human-readable script name
 * @property {string} description - Script description
 * @property {Array<ScriptSection>} sections - Ordered sections in the script
 * @property {Object} metadata - Additional script metadata
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 * @property {string} createdBy - Collaborator who created the script
 */

/**
 * ScriptSection schema - section reference within script
 * @typedef {Object} ScriptSection
 * @property {string} sectionId - Reference to section
 * @property {string} sectionName - Snapshot of section name
 * @property {number} position - Position within script (0-based)
 */

/**
 * Creates a new script object with default values
 * @param {Object} scriptData - Script configuration
 * @returns {Script} Formatted script object
 */
export function createScript(scriptData) {
    const now = new Date().toISOString()

    return {
        id: scriptData.id,
        name: scriptData.name,
        description: scriptData.description || '',
        sections: scriptData.sections || [],
        metadata: scriptData.metadata || {},
        createdAt: scriptData.createdAt || now,
        updatedAt: now,
        createdBy: scriptData.createdBy,
        ...scriptData,
    }
}

/**
 * Validates script structure
 * @param {Script} script - Script to validate
 * @returns {Object} Validation result with success flag and errors
 */
export function validateScript(script) {
    const errors = []

    if (!script.id) errors.push('Script ID is required')
    if (!script.name) errors.push('Script name is required')
    if (!script.createdBy) errors.push('Script createdBy is required')
    if (!Array.isArray(script.sections)) errors.push('Script sections must be an array')

    // Validate each section
    script.sections?.forEach((section, index) => {
        if (!section.sectionId) errors.push(`Section at index ${index} missing sectionId`)
        if (!section.sectionName) errors.push(`Section at index ${index} missing sectionName`)
        if (typeof section.position !== 'number') errors.push(`Section at index ${index} missing valid position`)
    })

    return {
        success: errors.length === 0,
        errors,
    }
}

/**
 * Adds a section to a script
 * @param {Script} script - Script to modify
 * @param {ScriptSection} section - Section to add
 * @returns {Script} Updated script
 */
export function addSectionToScript(script, section) {
    const sections = [...script.sections]

    // Adjust positions of existing sections if needed
    sections.forEach((existingSection) => {
        if (existingSection.position >= section.position) {
            existingSection.position++
        }
    })

    // Add new section
    sections.push(section)

    // Sort by position
    sections.sort((a, b) => a.position - b.position)

    return {
        ...script,
        sections,
        updatedAt: new Date().toISOString(),
    }
}

/**
 * Removes a section from a script
 * @param {Script} script - Script to modify
 * @param {string} sectionId - Section ID to remove
 * @returns {Script} Updated script
 */
export function removeSectionFromScript(script, sectionId) {
    const sections = script.sections.filter((s) => s.sectionId !== sectionId)

    // Reorder positions to be sequential
    sections.forEach((section, index) => {
        section.position = index
    })

    return {
        ...script,
        sections,
        updatedAt: new Date().toISOString(),
    }
}

/**
 * Reorders sections in a script
 * @param {Script} script - Script to modify
 * @param {number} fromIndex - Current position
 * @param {number} toIndex - New position
 * @returns {Script} Updated script
 */
export function reorderSectionsInScript(script, fromIndex, toIndex) {
    const sections = [...script.sections]
    const [removed] = sections.splice(fromIndex, 1)
    sections.splice(toIndex, 0, removed)

    // Update positions to match array indices
    sections.forEach((section, index) => {
        section.position = index
    })

    return {
        ...script,
        sections,
        updatedAt: new Date().toISOString(),
    }
}
