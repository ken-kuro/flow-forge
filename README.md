# Flow Forge - Project Specification

## 🎯 Project Overview

**Flow Forge** is a modern visual flow editor built with Vue 3, inspired by Chatfuel's flow builder. It provides an intuitive drag-and-drop interface for creating complex workflows with support for loops and nested sub-nodes.

### Key Features (Current Implementation)
- **Interactive Flow Canvas**: Vue Flow-powered editor with zoom, pan, and minimap
- **Node Management**: Create, delete, and position nodes with drag-and-drop
- **History System**: Full undo/redo with timeline navigation and keyboard shortcuts
- **Clean Architecture**: Separation of concerns with stores, composables, and components

### Planned Features
- **Nested Sub-Nodes**: Linear stacking of cards/plugins within nodes (Chatfuel-style)
- **Loop Support**: Self-referencing edges and cycle detection
- **Template System**: Pre-built flow templates
- **Advanced Node Types**: Input, output, logic, action, and data nodes

## 🏗️ Technical Stack

### Core Dependencies
- **Vue 3** (^3.5.13) with Composition API
- **Vue Flow** (^1.45.0) for interactive flowcharts
- **Pinia** (^3.0.3) for state management
- **Vue Router** (^4.5.1) for navigation
- **VueUse** (^13.3.0) for composable utilities

### UI & Styling
- **Tailwind CSS** (^4.1.10) with Vite plugin
- **DaisyUI** (^5.0.43) for component library
- **Catppuccin** theme integration
- **Lucide** icons for consistent iconography

### Development Tools
- **Vite** (^6.2.4) for build tooling
- **Vue DevTools** for debugging
- **UUID** library for unique identifiers

## 📁 Current File Structure

```
src/
├── assets/              # Static assets and themes
├── components/
│   ├── editor/         # Editor-specific components
│   │   └── toolbar.vue # Main editor toolbar
│   └── flow-editor.vue # Core Vue Flow component
├── composables/        # Vue 3 composables
│   └── use-flow-editor.js # Flow editor logic
├── layouts/           # Layout components
├── router/            # Vue Router configuration
├── stores/            # Pinia stores
│   └── flow-store.js  # Flow state management
├── utils/             # Utility functions
│   └── id-generator.js # UUID generation
└── views/             # Page components
    ├── editor-view.vue
    ├── home-view.vue
    └── templates-view.vue
```

## 🔧 Naming Conventions

### Files & Directories
- **kebab-case** for all files and directories
- **Component files**: `component-name.vue`
- **Composables**: `use-feature-name.js`
- **Stores**: `feature-name.js`

### Code Conventions
- **Component names**: PascalCase in code, kebab-case in templates
- **Props & variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase with descriptive verbs
- **CSS classes**: Tailwind/DaisyUI conventions

### Vue Patterns
- **Composition API** exclusively (no Options API)
- **Script setup** syntax for all components
- **Reactive state**: Use `ref()` and `reactive()` appropriately

## 🏛️ Architecture Principles

### State Management
- **Vue Flow**: Single source of truth for nodes/edges reactive state
- **Pinia Store**: History management, operations, and UI state
- **No dual state sync**: Avoid reactive loops between Vue Flow and stores

### Component Architecture
- **Composables**: Business logic extracted into reusable composables
- **Single Responsibility**: Each component has one clear purpose
- **Props Down, Events Up**: Standard Vue communication pattern
- **Clean Separation**: Presentation components separated from logic

### Current Implementation Details
- **History System**: Full undo/redo with state snapshots and timeline navigation
- **Event Handling**: Vue Flow events auto-wired through composables
- **Keyboard Shortcuts**: Ctrl+Z/Y for undo/redo, Ctrl+Alt+N for new nodes
- **Performance**: Optimized state saving (only on significant changes)

## 🎯 Development Guidelines

### Before Adding Features
1. Follow established file structure and naming conventions
2. Use the `useFlowEditor` composable for all flow operations
3. Keep Vue Flow as single source of truth for nodes/edges
4. Add proper JSDoc comments for functions
5. Test in browser for errors/warnings

### Code Quality Standards
- No console errors or Vue warnings
- Proper error boundary implementations
- Component props validation where needed
- Performance consideration for large flows
- Clean separation of concerns

### Current Keyboard Shortcuts
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Ctrl+Shift+Z` / `Cmd+Y`: Redo
- `Ctrl+Alt+N` / `Cmd+Option+N`: Create new node

---

*Current Status: Foundation Phase - Core editor with history system implemented*
