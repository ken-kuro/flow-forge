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
}; 