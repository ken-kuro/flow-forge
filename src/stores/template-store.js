/**
 * @fileoverview Template management store for administrators
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId } from '@/utils/id-generator'
import { createTemplate } from '@/schemas/template'

export const useTemplateStore = defineStore('template', () => {
    // --- STATE ---
    const templates = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // --- COMPUTED ---
    const templatesById = computed(() => {
        return templates.value.reduce((acc, template) => {
            acc[template.id] = template
            return acc
        }, {})
    })

    const templateCount = computed(() => templates.value.length)

    // --- ACTIONS ---

    /**
     * Creates a new template
     * @param {Object} templateData - Template configuration
     * @returns {Promise<Object>} Created template
     */
    async function createNewTemplate(templateData) {
        try {
            isLoading.value = true
            error.value = null

            const template = createTemplate({
                id: templateData.id || generateId('template'),
                ...templateData,
            })

            templates.value.push(template)

            // In a real app, this would save to backend
            await saveTemplates()

            return template
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Updates an existing template
     * @param {string} templateId - Template ID to update
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated template
     */
    async function updateTemplate(templateId, updates) {
        try {
            isLoading.value = true
            error.value = null

            const index = templates.value.findIndex((t) => t.id === templateId)
            if (index === -1) {
                throw new Error('Template not found')
            }

            const updatedTemplate = {
                ...templates.value[index],
                ...updates,
                updatedAt: new Date().toISOString(),
            }

            templates.value[index] = updatedTemplate

            await saveTemplates()

            return updatedTemplate
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Deletes a template
     * @param {string} templateId - Template ID to delete
     * @returns {Promise<void>}
     */
    async function deleteTemplate(templateId) {
        try {
            isLoading.value = true
            error.value = null

            const index = templates.value.findIndex((t) => t.id === templateId)
            if (index === -1) {
                throw new Error('Template not found')
            }

            // TODO: Check if template is referenced in any blueprints
            // This would require checking with the blueprint store

            templates.value.splice(index, 1)

            await saveTemplates()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Gets a template by ID
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template or null if not found
     */
    function getTemplateById(templateId) {
        return templates.value.find((t) => t.id === templateId) || null
    }

    /**
     * Loads templates from storage
     * @returns {Promise<void>}
     */
    async function loadTemplates() {
        try {
            isLoading.value = true
            error.value = null

            // In a real app, this would load from backend
            const stored = localStorage.getItem('ff_templates')
            if (stored) {
                templates.value = JSON.parse(stored)
            }
        } catch (err) {
            error.value = err.message
            // eslint-disable-next-line no-console
            console.error('Failed to load templates:', err)
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Saves templates to storage
     * @returns {Promise<void>}
     */
    async function saveTemplates() {
        try {
            // In a real app, this would save to backend
            localStorage.setItem('ff_templates', JSON.stringify(templates.value))
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to save templates:', err)
            throw err
        }
    }

    /**
     * Duplicates a template
     * @param {string} templateId - Template ID to duplicate
     * @param {string} newName - Name for the duplicate
     * @returns {Promise<Object>} Duplicated template
     */
    async function duplicateTemplate(templateId, newName) {
        const originalTemplate = getTemplateById(templateId)
        if (!originalTemplate) {
            throw new Error('Template not found')
        }

        return createNewTemplate({
            ...originalTemplate,
            id: generateId('template'),
            name: newName || `${originalTemplate.name} (Copy)`,
            createdAt: undefined, // Will be set by createTemplate
            updatedAt: undefined,
        })
    }

    /**
     * Searches templates by name or description
     * @param {string} query - Search query
     * @returns {Array<Object>} Matching templates
     */
    function searchTemplates(query) {
        if (!query) return templates.value

        const lowerQuery = query.toLowerCase()
        return templates.value.filter(
            (template) =>
                template.name.toLowerCase().includes(lowerQuery) ||
                template.description.toLowerCase().includes(lowerQuery),
        )
    }

    // Load templates on store initialization
    loadTemplates()

    return {
        // State
        templates,
        isLoading,
        error,

        // Computed
        templatesById,
        templateCount,

        // Actions
        createNewTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplateById,
        loadTemplates,
        saveTemplates,
        duplicateTemplate,
        searchTemplates,
    }
})
