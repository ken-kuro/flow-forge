/**
 * @fileoverview Template schema definitions for the Enhanced Flow Management System
 */

/**
 * Creates a new template object with default values
 * @param {Object} templateData - Template configuration
 * @returns {Object} Formatted template object
 */
export function createTemplate(templateData) {
    const now = new Date().toISOString()

    return {
        id: templateData.id,
        name: templateData.name,
        description: templateData.description || '',
        nodes: templateData.nodes || [],
        edges: templateData.edges || [],
        nodeBlocks: templateData.nodeBlocks || {},
        defaultData: templateData.defaultData || {},
        createdAt: templateData.createdAt || now,
        updatedAt: now,
        version: templateData.version || 1,
        ...templateData,
    }
}
