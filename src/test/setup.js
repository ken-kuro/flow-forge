// Vitest setup file
import { vi } from 'vitest'

// Mock Vue Flow if needed for testing
vi.mock('@vue-flow/core', () => ({
    VueFlow: {
        name: 'VueFlow',
        template: '<div data-testid="vue-flow-mock"></div>',
    },
    useVueFlow: () => ({
        nodes: [],
        edges: [],
        addNodes: vi.fn(),
        addEdges: vi.fn(),
        removeNodes: vi.fn(),
        removeEdges: vi.fn(),
        updateNode: vi.fn(),
        updateEdge: vi.fn(),
        fitView: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
    }),
    Position: {
        Top: 'top',
        Right: 'right',
        Bottom: 'bottom',
        Left: 'left',
    },
}))

// Global test utilities
globalThis.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})
