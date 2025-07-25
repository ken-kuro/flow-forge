/**
 * @fileoverview Access control system for role-based permissions
 */

/**
 * User roles in the system
 */
export const USER_ROLES = {
    ADMIN: 'admin',
    COLLABORATOR: 'collaborator',
}

/**
 * Access keys configuration
 * In a real application, these would be stored securely and possibly in a database
 */
const ACCESS_KEYS = {
    // Admin keys - provide full access to template management
    admin: ['admin123', 'template-master', 'flow-admin'],
    // Collaborator keys - provide access to script and flow creation
    collaborator: ['collab456', 'script-creator', 'flow-builder'],
}

/**
 * Permissions mapping
 */
export const PERMISSIONS = {
    // Template Management (Admin only)
    CREATE_TEMPLATE: 'create_template',
    EDIT_TEMPLATE: 'edit_template',
    DELETE_TEMPLATE: 'delete_template',

    // Group Management (Admin only)
    CREATE_GROUP: 'create_group',
    EDIT_GROUP: 'edit_group',
    DELETE_GROUP: 'delete_group',

    // Section Management (Admin only)
    CREATE_SECTION: 'create_section',
    EDIT_SECTION: 'edit_section',
    DELETE_SECTION: 'delete_section',

    // Blueprint Management (Admin only)
    CREATE_BLUEPRINT: 'create_blueprint',
    EDIT_BLUEPRINT: 'edit_blueprint',
    DELETE_BLUEPRINT: 'delete_blueprint',

    // Script Management (Collaborator only)
    CREATE_SCRIPT: 'create_script',
    EDIT_SCRIPT: 'edit_script',
    DELETE_SCRIPT: 'delete_script',

    // Setup Management (Collaborator only)
    CREATE_SETUP: 'create_setup',
    EDIT_SETUP: 'edit_setup',
    DELETE_SETUP: 'delete_setup',

    // Flow Management (Collaborator only)
    CREATE_FLOW: 'create_flow',
    EDIT_FLOW: 'edit_flow',
    DELETE_FLOW: 'delete_flow',

    // Read permissions (both roles)
    VIEW_TEMPLATES: 'view_templates',
    VIEW_GROUPS: 'view_groups',
    VIEW_SECTIONS: 'view_sections',
    VIEW_BLUEPRINTS: 'view_blueprints',
    VIEW_SCRIPTS: 'view_scripts',
    VIEW_SETUPS: 'view_setups',
    VIEW_FLOWS: 'view_flows',
}

/**
 * Role permissions mapping
 */
const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: [
        // Template management
        PERMISSIONS.CREATE_TEMPLATE,
        PERMISSIONS.EDIT_TEMPLATE,
        PERMISSIONS.DELETE_TEMPLATE,

        // Group management
        PERMISSIONS.CREATE_GROUP,
        PERMISSIONS.EDIT_GROUP,
        PERMISSIONS.DELETE_GROUP,

        // Section management
        PERMISSIONS.CREATE_SECTION,
        PERMISSIONS.EDIT_SECTION,
        PERMISSIONS.DELETE_SECTION,

        // Blueprint management
        PERMISSIONS.CREATE_BLUEPRINT,
        PERMISSIONS.EDIT_BLUEPRINT,
        PERMISSIONS.DELETE_BLUEPRINT,

        // View permissions
        PERMISSIONS.VIEW_TEMPLATES,
        PERMISSIONS.VIEW_GROUPS,
        PERMISSIONS.VIEW_SECTIONS,
        PERMISSIONS.VIEW_BLUEPRINTS,
    ],

    [USER_ROLES.COLLABORATOR]: [
        // Script management
        PERMISSIONS.CREATE_SCRIPT,
        PERMISSIONS.EDIT_SCRIPT,
        PERMISSIONS.DELETE_SCRIPT,

        // Setup management
        PERMISSIONS.CREATE_SETUP,
        PERMISSIONS.EDIT_SETUP,
        PERMISSIONS.DELETE_SETUP,

        // Flow management
        PERMISSIONS.CREATE_FLOW,
        PERMISSIONS.EDIT_FLOW,
        PERMISSIONS.DELETE_FLOW,

        // View permissions (read-only access to admin-created content)
        PERMISSIONS.VIEW_TEMPLATES,
        PERMISSIONS.VIEW_GROUPS,
        PERMISSIONS.VIEW_SECTIONS,
        PERMISSIONS.VIEW_BLUEPRINTS,
        PERMISSIONS.VIEW_SCRIPTS,
        PERMISSIONS.VIEW_SETUPS,
        PERMISSIONS.VIEW_FLOWS,
    ],
}

/**
 * Validates an access key and returns the associated role
 * @param {string} accessKey - Access key to validate
 * @returns {string|null} User role or null if invalid
 */
export function validateAccessKey(accessKey) {
    if (!accessKey) return null

    // Check admin keys
    if (ACCESS_KEYS.admin.includes(accessKey)) {
        return USER_ROLES.ADMIN
    }

    // Check collaborator keys
    if (ACCESS_KEYS.collaborator.includes(accessKey)) {
        return USER_ROLES.COLLABORATOR
    }

    return null
}

/**
 * Checks if a user role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(role, permission) {
    if (!role || !permission) return false

    const rolePermissions = ROLE_PERMISSIONS[role] || []
    return rolePermissions.includes(permission)
}

/**
 * Gets all permissions for a user role
 * @param {string} role - User role
 * @returns {Array<string>} Array of permissions
 */
export function getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || []
}

/**
 * Extracts access key from URL parameters
 * @param {string} url - URL to parse
 * @returns {string|null} Access key or null if not found
 */
export function extractAccessKeyFromUrl(url) {
    try {
        const urlObj = new URL(url)
        return urlObj.searchParams.get('key') || urlObj.searchParams.get('access_key')
    } catch {
        return null
    }
}

/**
 * Creates a URL with access key parameter
 * @param {string} path - Base path
 * @param {string} accessKey - Access key to include
 * @returns {string} URL with access key
 */
export function createUrlWithAccessKey(path, accessKey) {
    const url = new URL(path, window.location.origin)
    url.searchParams.set('key', accessKey)
    return url.toString()
}
