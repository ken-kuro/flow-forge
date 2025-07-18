import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useFlowStore } from './flow-store.js'
import { NODE_TYPES } from '@/utils/constants.js'

/**
 * Flow Context Store
 *
 * Manages the simplified context-aware asset system where:
 * - Each flow has exactly one setup node with all assets
 * - The entire flow shares the same asset context from this setup node
 * - Asset constraints: one elements config, one LMS type per flow
 * - Node loading rules based on LMS type
 *
 * TODO: Separate validation-related logic into a dedicated validation file:
 * - validationResult, validateAssetAddition, analyzeAssetChangeImpact,
 *   confirmAssetChange, resetAffectedBlocks should be moved to
 *   utils/flow-validation.js or stores/flow-validation-store.js
 */
export const useFlowContextStore = defineStore('flowContext', () => {
    // --- STATE ---
    const flowStore = useFlowStore()

    // --- COMPUTED GETTERS ---

    /**
     * Get the single setup node for the current flow
     * @returns {Object|null} The setup node or null if not found
     */
    const setupNode = computed(() => {
        const setupNodes = flowStore.nodes.filter((node) => node.type === NODE_TYPES.SETUP)
        if (setupNodes.length === 0) return null
        if (setupNodes.length > 1) {
            console.warn('🚨 Multiple setup nodes found. Using the first one.')
        }
        return setupNodes[0]
    })

    /**
     * Get all asset blocks from the setup node
     * @returns {Array} Array of asset blocks
     */
    const setupAssets = computed(() => {
        if (!setupNode.value) return []
        return flowStore
            .getNodeBlocks(setupNode.value.id)
            .filter((block) => ['asset-image', 'asset-video', 'asset-lms'].includes(block.type))
    })

    /**
     * Get the single image asset with elements configuration
     * @returns {Object|null} Image asset with elements or null
     */
    const imageAssetWithElements = computed(() => {
        const imageAssets = setupAssets.value.filter((asset) => asset.type === 'asset-image')
        return (
            imageAssets.find(
                (asset) =>
                    (asset.data.objects && asset.data.objects.length > 0) ||
                    (asset.data.texts && asset.data.texts.length > 0),
            ) || null
        )
    })

    /**
     * Get normal image assets (without elements configuration)
     * @returns {Array} Array of normal image assets
     */
    const normalImageAssets = computed(() => {
        const imageAssets = setupAssets.value.filter((asset) => asset.type === 'asset-image')
        return imageAssets.filter(
            (asset) =>
                (!asset.data.objects || asset.data.objects.length === 0) &&
                (!asset.data.texts || asset.data.texts.length === 0),
        )
    })

    /**
     * Get all video assets
     * @returns {Array} Array of video assets
     */
    const videoAssets = computed(() => {
        return setupAssets.value.filter((asset) => asset.type === 'asset-video')
    })

    /**
     * Get the single LMS asset configuration
     * @returns {Object|null} LMS asset or null
     */
    const lmsAsset = computed(() => {
        const lmsAssets = setupAssets.value.filter((asset) => asset.type === 'asset-lms')
        if (lmsAssets.length === 0) return null
        if (lmsAssets.length > 1) {
            console.warn('🚨 Multiple LMS assets found. Using the first one.')
        }
        return lmsAssets[0]
    })

    /**
     * Get objects from the image asset with elements
     * @returns {Array} Array of objects
     */
    const objects = computed(() => {
        return imageAssetWithElements.value?.data.objects || []
    })

    /**
     * Get texts from the image asset with elements
     * @returns {Array} Array of texts
     */
    const texts = computed(() => {
        return imageAssetWithElements.value?.data.texts || []
    })

    /**
     * Get the LMS type from the LMS asset
     * @returns {string|null} LMS type or null
     */
    const lmsType = computed(() => {
        return lmsAsset.value?.data.lmsType || null
    })

    /**
     * Get the question type from the LMS asset (only for practice)
     * @returns {string|null} Question type or null
     */
    const questionType = computed(() => {
        const lms = lmsAsset.value
        if (!lms || lms.data.lmsType !== 'practice') return null
        return lms.data.questionData?.type || null
    })

    /**
     * Check if the flow has an elements configuration
     * @returns {boolean} True if elements config exists
     */
    const hasElementsConfig = computed(() => {
        return imageAssetWithElements.value !== null
    })

    /**
     * Check if nodes can have both image/video + LMS blocks
     * (speaking types: scripted and unscripted)
     * @returns {boolean} True if dual asset blocks are allowed
     */
    const allowsDualAssetBlocks = computed(() => {
        if (!lmsType.value || lmsType.value !== 'practice') return false
        const qType = questionType.value
        return qType === 'speaking_unscripted' || qType === 'speaking_scripted'
    })

    /**
     * Validation result for asset constraints
     * @returns {Object} Validation result with errors
     */
    const validationResult = computed(() => {
        const result = {
            isValid: true,
            errors: [],
        }

        if (!setupNode.value) {
            result.isValid = false
            result.errors.push('No setup node found')
            return result
        }

        const lmsBlocks = setupAssets.value.filter((asset) => asset.type === 'asset-lms')
        const imageBlocks = setupAssets.value.filter((asset) => asset.type === 'asset-image')

        // Check LMS constraint: All LMS blocks must have the same type and question type
        if (lmsBlocks.length > 1) {
            const firstLms = lmsBlocks[0]
            const firstLmsType = firstLms.data?.lmsType
            const firstQuestionType = firstLms.data?.questionData?.type

            for (let i = 1; i < lmsBlocks.length; i++) {
                const currentLms = lmsBlocks[i]
                const currentLmsType = currentLms.data?.lmsType
                const currentQuestionType = currentLms.data?.questionData?.type

                if (currentLmsType !== firstLmsType) {
                    result.isValid = false
                    result.errors.push(
                        `All LMS blocks must have the same type. Found: ${firstLmsType} and ${currentLmsType}`,
                    )
                }

                if (currentQuestionType !== firstQuestionType) {
                    result.isValid = false
                    result.errors.push(
                        `All LMS blocks must have the same question type. Found: ${firstQuestionType} and ${currentQuestionType}`,
                    )
                }
            }
        }

        // Check elements constraint: Only one image can have elements configuration
        const imagesWithElements = imageBlocks.filter(
            (block) => block.data.objects?.length > 0 || block.data.texts?.length > 0,
        )

        if (imagesWithElements.length > 1) {
            result.isValid = false
            result.errors.push('Only one image asset can have elements configuration')
        }

        return result
    })

    // --- ACTIONS ---

    /**
     * Check what would be affected if an asset block is removed or changed
     * @param {string} assetBlockId - The asset block ID being changed/removed
     * @param {string} changeType - Type of change: 'remove', 'lms-type-change', 'elements-change'
     * @returns {Object} Impact analysis with affected blocks and warnings
     */
    const analyzeAssetChangeImpact = (assetBlockId, changeType) => {
        const impact = {
            affectedBlocks: [],
            warnings: [],
            canProceed: true,
        }

        const flowStore = useFlowStore()

        // Find which asset this is
        const assetBlock = Object.values(flowStore.nodeBlocks)
            .flat()
            .find((block) => block.id === assetBlockId)

        if (!assetBlock) return impact

        // For LMS asset changes
        if (assetBlock.type === 'asset-lms' && ['remove', 'lms-type-change'].includes(changeType)) {
            // Find all collect user data, system action, and condition blocks
            const allBlocks = Object.entries(flowStore.nodeBlocks)

            for (const [nodeId, blocks] of allBlocks) {
                for (const block of blocks) {
                    if (block.type === 'collect-user-data' && block.data.methods?.length > 0) {
                        impact.affectedBlocks.push({
                            nodeId,
                            blockId: block.id,
                            blockType: 'collect-user-data',
                            blockTitle: block.data.title,
                            issue: 'Collection methods will be reset',
                        })
                    }

                    if (block.type === 'system-action' && block.data.methods?.length > 0) {
                        impact.affectedBlocks.push({
                            nodeId,
                            blockId: block.id,
                            blockType: 'system-action',
                            blockTitle: block.data.title,
                            issue: 'Action methods and targets will be reset',
                        })
                    }

                    if (block.type === 'condition-branch' && block.data.condition) {
                        impact.affectedBlocks.push({
                            nodeId,
                            blockId: block.id,
                            blockType: 'condition-branch',
                            blockTitle: block.data.title,
                            issue: 'Predefined conditions will be reset',
                        })
                    }
                }
            }
        }

        // For image elements changes
        if (assetBlock.type === 'asset-image' && ['remove', 'elements-change'].includes(changeType)) {
            const currentElements = (assetBlock.data.objects?.length || 0) + (assetBlock.data.texts?.length || 0)

            if (currentElements > 0) {
                // Find system action blocks that might be using these elements
                const allBlocks = Object.entries(flowStore.nodeBlocks)

                for (const [nodeId, blocks] of allBlocks) {
                    for (const block of blocks) {
                        if (block.type === 'system-action' && block.data.targets?.length > 0) {
                            impact.affectedBlocks.push({
                                nodeId,
                                blockId: block.id,
                                blockType: 'system-action',
                                blockTitle: block.data.title,
                                issue: 'Available targets may change',
                            })
                        }
                    }
                }
            }
        }

        // For asset removal
        if (changeType === 'remove') {
            // Find assets-applied blocks referencing this asset
            const allBlocks = Object.entries(flowStore.nodeBlocks)

            for (const [nodeId, blocks] of allBlocks) {
                for (const block of blocks) {
                    if (block.type === 'assets-applied' && block.data.selectedAssetId === assetBlockId) {
                        impact.affectedBlocks.push({
                            nodeId,
                            blockId: block.id,
                            blockType: 'assets-applied',
                            blockTitle: block.data.title,
                            issue: 'Asset reference will be reset',
                        })
                    }
                }
            }
        }

        // Generate warnings
        if (impact.affectedBlocks.length > 0) {
            impact.warnings.push(`This change will affect ${impact.affectedBlocks.length} block(s) in your flow.`)

            const groupedByType = impact.affectedBlocks.reduce((acc, block) => {
                if (!acc[block.blockType]) acc[block.blockType] = 0
                acc[block.blockType]++
                return acc
            }, {})

            for (const [type, count] of Object.entries(groupedByType)) {
                impact.warnings.push(`• ${count} ${type.replace('-', ' ')} block(s) will be reset`)
            }
        }

        return impact
    }

    /**
     * Show confirmation dialog for asset changes that might affect other blocks
     * @param {Object} impact - Impact analysis from analyzeAssetChangeImpact
     * @param {string} actionName - Name of the action (e.g., "remove LMS asset", "change LMS type")
     * @returns {boolean} Whether user confirmed the change
     */
    const confirmAssetChange = (impact, actionName) => {
        if (impact.affectedBlocks.length === 0) {
            return true // No impact, proceed
        }

        const message = [
            `Are you sure you want to ${actionName}?`,
            '',
            ...impact.warnings,
            '',
            'This action cannot be undone.',
        ].join('\n')

        return confirm(message)
    }

    /**
     * Reset affected blocks when asset changes occur
     * @param {Array} affectedBlocks - Array of affected blocks from impact analysis
     */
    const resetAffectedBlocks = (affectedBlocks) => {
        const flowStore = useFlowStore()

        for (const affected of affectedBlocks) {
            const blocks = flowStore.nodeBlocks[affected.nodeId] || []
            const block = blocks.find((b) => b.id === affected.blockId)

            if (!block) continue

            let resetData = {}

            switch (affected.blockType) {
                case 'collect-user-data':
                    resetData = { methods: [] }
                    break
                case 'system-action':
                    resetData = { methods: [], targets: [] }
                    break
                case 'condition-branch':
                    if (block.data.inputMode === 'predefined') {
                        resetData = { condition: '', cup: 0 }
                    }
                    break
                case 'assets-applied':
                    resetData = { selectedAssetId: '', assetType: 'any' }
                    break
            }

            if (Object.keys(resetData).length > 0) {
                flowStore.updateBlock(affected.nodeId, affected.blockId, resetData, true)
            }
        }
    }

    /**
     * Validate if a new asset can be added to the setup node
     * @param {string} assetType - The type of asset to add
     * @param {Object} assetData - The asset data
     * @returns {Object} Validation result
     */
    const validateAssetAddition = (assetType, assetData) => {
        const errors = []

        if (assetType === 'asset-image' && assetData.objects && assetData.objects.length > 0) {
            if (hasElementsConfig.value) {
                errors.push('Flow can have only one image asset with elements configuration')
            }
        }

        if (assetType === 'asset-lms') {
            // Check if new LMS block conflicts with existing ones
            const existingLmsBlocks = setupAssets.value.filter((asset) => asset.type === 'asset-lms')

            if (existingLmsBlocks.length > 0) {
                const firstLms = existingLmsBlocks[0]
                const existingLmsType = firstLms.data?.lmsType
                const existingQuestionType = firstLms.data?.questionData?.type

                // Only reject if types don't match
                if (assetData.lmsType && assetData.lmsType !== existingLmsType) {
                    errors.push(`LMS type must match existing: ${existingLmsType}`)
                }

                if (assetData.questionData?.type && assetData.questionData.type !== existingQuestionType) {
                    errors.push(`Question type must match existing: ${existingQuestionType}`)
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    /**
     * Get available assets for a specific node based on loading rules
     * @param {string} nodeId - The node ID
     * @returns {Object} Available assets for the node
     */
    const getAvailableAssetsForNode = (nodeId) => {
        const availableAssets = {
            images: [],
            videos: [],
            lms: null,
        }

        // Add image assets
        if (imageAssetWithElements.value) {
            availableAssets.images.push(imageAssetWithElements.value)
        }
        availableAssets.images.push(...normalImageAssets.value)

        // Add video assets
        availableAssets.videos.push(...videoAssets.value)

        // Add LMS asset
        if (lmsAsset.value) {
            availableAssets.lms = lmsAsset.value
        }

        return availableAssets
    }

    /**
     * Check if a node can have multiple asset applied blocks
     * @param {string} nodeId - The node ID
     * @returns {boolean} True if multiple blocks are allowed
     */
    const canNodeHaveMultipleAssetBlocks = (nodeId) => {
        return allowsDualAssetBlocks.value
    }

    /**
     * Get the maximum number of asset blocks allowed for a node
     * @param {string} nodeId - The node ID
     * @returns {number} Maximum number of asset blocks
     */
    const getMaxAssetBlocksForNode = (nodeId) => {
        return allowsDualAssetBlocks.value ? 2 : 1 // 1 image/video + 1 LMS for speaking types
    }

    return {
        // Computed getters
        setupNode,
        setupAssets,
        imageAssetWithElements,
        normalImageAssets,
        videoAssets,
        lmsAsset,
        objects,
        texts,
        lmsType,
        questionType,
        hasElementsConfig,
        allowsDualAssetBlocks,
        validationResult,

        // Actions
        validateAssetAddition,
        getAvailableAssetsForNode,
        canNodeHaveMultipleAssetBlocks,
        getMaxAssetBlocksForNode,
        analyzeAssetChangeImpact,
        confirmAssetChange,
        resetAffectedBlocks,
    }
})
