/**
 * @fileoverview Centralized constants for the application.
 * This file helps prevent magic strings and ensures consistency across the codebase.
 */

/**
 * Defines the unique type strings for all custom nodes used in the application.
 * Using these constants prevents typos and makes refactoring easier.
 * @const {Object<string, string>}
 */
export const NODE_TYPES = {
    START: 'custom-start',
    END: 'custom-end',
    SETUP: 'custom-setup',
    LECTURE: 'custom-lecture',
    CONDITION: 'custom-condition',
}

/**
 * Configuration constants for the application.
 */
export const CONFIG = {
    /**
     * Maximum number of history entries to keep for undo/redo functionality.
     * Older entries are automatically removed to prevent memory issues.
     * @const {number}
     */
    MAX_HISTORY_ENTRIES: 20,
}

/**
 * Block Types for different nodes
 */
export const BLOCK_TYPES = {
    // Lecture blocks
    TEACHER_VIDEO: 'teacher-video',
    AUDIO: 'audio',
    ASSETS_APPLIED: 'assets-applied',
    COLLECT_USER_DATA: 'collect-user-data',
    SYSTEM_ACTION: 'system-action',

    // Setup blocks
    IMAGE_ASSET: 'image-asset',
    VIDEO_ASSET: 'video-asset',
    LMS_ASSET: 'lms-asset',
}

/**
 * Edge Types
 */
export const EDGE_TYPES = {
    DEFAULT: 'default',
    CONDITION: 'condition',
}

/**
 * Enhanced Flow Management System Constants
 */
export const ENTITY_TYPES = {
    TEMPLATE: 'template',
    GROUP: 'group',
    SECTION: 'section',
    BLUEPRINT: 'blueprint',
    SCRIPT: 'script',
    SETUP: 'setup',
    FLOW: 'flow',
}

/**
 * User Roles
 */
export const USER_ROLES = {
    ADMIN: 'admin',
    COLLABORATOR: 'collaborator',
}

/**
 * Access Keys
 */
export const ACCESS_KEYS = {
    ADMIN: 'admin123',
    COLLABORATOR: 'collab456',
}

/**
 * Default Values
 */
export const DEFAULTS = {
    TEMPLATE_NAME: 'New Template',
    GROUP_NAME: 'New Group',
    SECTION_NAME: 'New Section',
    BLUEPRINT_NAME: 'New Blueprint',
    SCRIPT_NAME: 'New Script',
    SETUP_NAME: 'New Setup',
    FLOW_NAME: 'New Flow',
}
