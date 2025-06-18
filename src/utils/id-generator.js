import { v4 as uuidv4 } from 'uuid'

/**
 * Utility functions for generating unique identifiers
 */

/**
 * Generates a UUID v4 for nodes, edges, or any other entities
 * @returns {string} A UUID v4 string
 */
export function generateId() {
  return uuidv4()
}

/**
 * Generates a UUID with a prefix for easier identification in debugging
 * @param {string} prefix - The prefix to add (e.g., 'node', 'edge', 'group')
 * @returns {string} A prefixed UUID string
 */
export function generateIdWithPrefix(prefix) {
  return `${prefix}_${uuidv4()}`
}

/**
 * Validates if a string is a valid UUID v4
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid UUID v4
 */
export function isValidId(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
} 