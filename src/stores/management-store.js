/**
 * @fileoverview Enhanced management store that orchestrates all entities
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId } from '@/utils/id-generator'
import { createGroup } from '@/schemas/group'
import { createSection } from '@/schemas/section'
import { createBlueprint } from '@/schemas/blueprint'
import { createScript } from '@/schemas/script'
import { createSetup } from '@/schemas/setup'
import { createFlow } from '@/schemas/flow'

export const useManagementStore = defineStore('management', () => {
    // --- STATE ---
    const groups = ref([])
    const sections = ref([])
    const blueprints = ref([])
    const scripts = ref([])
    const setups = ref([])
    const flows = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // --- COMPUTED ---
    const groupsById = computed(() => {
        return groups.value.reduce((acc, group) => {
            acc[group.id] = group
            return acc
        }, {})
    })

    const sectionsById = computed(() => {
        return sections.value.reduce((acc, section) => {
            acc[section.id] = section
            return acc
        }, {})
    })

    const blueprintsById = computed(() => {
        return blueprints.value.reduce((acc, blueprint) => {
            acc[blueprint.id] = blueprint
            return acc
        }, {})
    })

    const scriptsByUser = computed(() => {
        return scripts.value.reduce((acc, script) => {
            if (!acc[script.createdBy]) {
                acc[script.createdBy] = []
            }
            acc[script.createdBy].push(script)
            return acc
        }, {})
    })

    // --- GROUP ACTIONS ---

    async function createNewGroup(groupData) {
        try {
            isLoading.value = true
            error.value = null

            const group = createGroup({
                id: groupData.id || generateId('group'),
                ...groupData,
            })

            groups.value.push(group)
            await saveData()
            return group
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function updateGroup(groupId, updates) {
        try {
            isLoading.value = true
            error.value = null

            const index = groups.value.findIndex((g) => g.id === groupId)
            if (index === -1) {
                throw new Error('Group not found')
            }

            const updatedGroup = {
                ...groups.value[index],
                ...updates,
                updatedAt: new Date().toISOString(),
            }

            groups.value[index] = updatedGroup
            await saveData()
            return updatedGroup
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // --- SECTION ACTIONS ---

    async function createNewSection(sectionData) {
        try {
            isLoading.value = true
            error.value = null

            const section = createSection({
                id: sectionData.id || generateId('section'),
                ...sectionData,
            })

            sections.value.push(section)
            await saveData()
            return section
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // --- BLUEPRINT ACTIONS ---

    async function createNewBlueprint(blueprintData) {
        try {
            isLoading.value = true
            error.value = null

            const blueprint = createBlueprint({
                id: blueprintData.id || generateId('blueprint'),
                ...blueprintData,
            })

            blueprints.value.push(blueprint)
            await saveData()
            return blueprint
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // --- SCRIPT ACTIONS ---

    async function createNewScript(scriptData) {
        try {
            isLoading.value = true
            error.value = null

            const script = createScript({
                id: scriptData.id || generateId('script'),
                ...scriptData,
            })

            scripts.value.push(script)
            await saveData()
            return script
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // --- SETUP ACTIONS ---

    async function createSetupFromBlueprint(blueprintId, scriptId, sectionId) {
        try {
            isLoading.value = true
            error.value = null

            const blueprint = blueprintsById.value[blueprintId]
            if (!blueprint) {
                throw new Error('Blueprint not found')
            }

            const section = sectionsById.value[sectionId]
            if (!section) {
                throw new Error('Section not found')
            }

            // Create setup as independent snapshot
            const setup = createSetup({
                id: generateId('setup'),
                scriptId,
                sectionId,
                sectionName: section.name,
                originalBlueprintId: blueprintId,
                groups:
                    blueprint.groups?.map((group) => ({
                        groupId: generateId('setup-group'),
                        groupName: group.groupName,
                        originalGroupId: group.groupId,
                        position: group.position,
                        flowIds: group.templates?.map(() => generateId('flow')) || [],
                    })) || [],
            })

            // Create flows for each template in the blueprint
            const newFlows = []
            for (const group of blueprint.groups || []) {
                const setupGroup = setup.groups.find((g) => g.originalGroupId === group.groupId)
                for (let i = 0; i < (group.templates?.length || 0); i++) {
                    const template = group.templates[i]
                    const flowId = setupGroup.flowIds[i]

                    const flow = createFlow({
                        id: flowId,
                        setupId: setup.id,
                        groupId: setupGroup.groupId,
                        templateId: template.templateId,
                        templateName: template.templateName,
                        instanceId: template.instanceId,
                        blocks: {}, // Empty initially, to be filled by collaborator
                    })

                    newFlows.push(flow)
                }
            }

            setups.value.push(setup)
            flows.value.push(...newFlows)
            await saveData()

            return { setup, flows: newFlows }
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // --- FLOW ACTIONS ---

    async function updateFlowData(flowId, blockKey, blockData) {
        try {
            const index = flows.value.findIndex((f) => f.id === flowId)
            if (index === -1) {
                throw new Error('Flow not found')
            }

            const updatedFlow = {
                ...flows.value[index],
                blocks: {
                    ...flows.value[index].blocks,
                    [blockKey]: {
                        ...flows.value[index].blocks[blockKey],
                        ...blockData,
                    },
                },
                updatedAt: new Date().toISOString(),
            }

            flows.value[index] = updatedFlow
            await saveData()
            return updatedFlow
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    // --- UTILITY ACTIONS ---

    async function loadData() {
        try {
            isLoading.value = true
            error.value = null

            const storedGroups = localStorage.getItem('ff_groups')
            if (storedGroups) {
                groups.value = JSON.parse(storedGroups)
            }

            const storedSections = localStorage.getItem('ff_sections')
            if (storedSections) {
                sections.value = JSON.parse(storedSections)
            }

            const storedBlueprints = localStorage.getItem('ff_blueprints')
            if (storedBlueprints) {
                blueprints.value = JSON.parse(storedBlueprints)
            }

            const storedScripts = localStorage.getItem('ff_scripts')
            if (storedScripts) {
                scripts.value = JSON.parse(storedScripts)
            }

            const storedSetups = localStorage.getItem('ff_setups')
            if (storedSetups) {
                setups.value = JSON.parse(storedSetups)
            }

            const storedFlows = localStorage.getItem('ff_flows')
            if (storedFlows) {
                flows.value = JSON.parse(storedFlows)
            }
        } catch (err) {
            error.value = err.message
            // eslint-disable-next-line no-console
            console.error('Failed to load data:', err)
        } finally {
            isLoading.value = false
        }
    }

    async function saveData() {
        try {
            localStorage.setItem('ff_groups', JSON.stringify(groups.value))
            localStorage.setItem('ff_sections', JSON.stringify(sections.value))
            localStorage.setItem('ff_blueprints', JSON.stringify(blueprints.value))
            localStorage.setItem('ff_scripts', JSON.stringify(scripts.value))
            localStorage.setItem('ff_setups', JSON.stringify(setups.value))
            localStorage.setItem('ff_flows', JSON.stringify(flows.value))
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to save data:', err)
            throw err
        }
    }

    // Load data on store initialization
    loadData()

    return {
        // State
        groups,
        sections,
        blueprints,
        scripts,
        setups,
        flows,
        isLoading,
        error,

        // Computed
        groupsById,
        sectionsById,
        blueprintsById,
        scriptsByUser,

        // Actions
        createNewGroup,
        updateGroup,
        createNewSection,
        createNewBlueprint,
        createNewScript,
        createSetupFromBlueprint,
        updateFlowData,
        loadData,
        saveData,
    }
})
