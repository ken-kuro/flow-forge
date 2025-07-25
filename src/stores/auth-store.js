/**
 * @fileoverview Authentication store for managing user access and permissions
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { validateAccessKey, hasPermission, USER_ROLES, extractAccessKeyFromUrl } from '@/utils/access-control'

export const useAuthStore = defineStore('auth', () => {
    // --- STATE ---
    const currentAccessKey = ref(null)
    const currentUserRole = ref(null)
    const isAuthenticated = ref(false)

    // --- COMPUTED ---
    const userRole = computed(() => currentUserRole.value)
    const isAdmin = computed(() => currentUserRole.value === USER_ROLES.ADMIN)
    const isCollaborator = computed(() => currentUserRole.value === USER_ROLES.COLLABORATOR)

    // --- ACTIONS ---

    /**
     * Authenticates user with access key
     * @param {string} accessKey - Access key to validate
     * @returns {boolean} True if authentication successful
     */
    function authenticate(accessKey) {
        const role = validateAccessKey(accessKey)

        if (role) {
            currentAccessKey.value = accessKey
            currentUserRole.value = role
            isAuthenticated.value = true

            // Store in localStorage for persistence
            localStorage.setItem('ff_access_key', accessKey)

            return true
        }

        return false
    }

    /**
     * Logs out the current user
     */
    function logout() {
        currentAccessKey.value = null
        currentUserRole.value = null
        isAuthenticated.value = false

        // Clear from localStorage
        localStorage.removeItem('ff_access_key')
    }

    /**
     * Checks if current user has specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean} True if user has permission
     */
    function userHasPermission(permission) {
        return hasPermission(currentUserRole.value, permission)
    }

    /**
     * Initializes authentication from localStorage or URL
     */
    function initializeAuth() {
        // First check URL for access key
        const urlKey = extractAccessKeyFromUrl(window.location.href)
        if (urlKey && authenticate(urlKey)) {
            return
        }

        // Then check localStorage
        const storedKey = localStorage.getItem('ff_access_key')
        if (storedKey) {
            authenticate(storedKey)
        }
    }

    /**
     * Gets display name for current user role
     * @returns {string} Display name
     */
    function getUserRoleDisplayName() {
        switch (currentUserRole.value) {
            case USER_ROLES.ADMIN:
                return 'Administrator'
            case USER_ROLES.COLLABORATOR:
                return 'Collaborator'
            default:
                return 'Guest'
        }
    }

    // Initialize auth on store creation
    initializeAuth()

    return {
        // State
        currentAccessKey,
        currentUserRole,
        isAuthenticated,

        // Computed
        userRole,
        isAdmin,
        isCollaborator,

        // Actions
        authenticate,
        logout,
        userHasPermission,
        initializeAuth,
        getUserRoleDisplayName,
    }
})
