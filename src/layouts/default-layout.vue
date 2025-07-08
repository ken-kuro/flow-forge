<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useColorMode, useStorage } from '@vueuse/core'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { computed } from 'vue'

const route = useRoute()
const isEditorPage = computed(() => route.path === '/editor')

const mode = useColorMode({
  selector: 'html',
  attribute: 'data-theme',
  modes: {
    light: 'latte',
    dark: 'mocha',
  },
})

const selectedTheme = useStorage('theme-choice', 'auto')

function setTheme(theme) {
  mode.value = theme
  selectedTheme.value = theme
}
</script>

<template>
  <div class="drawer">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    
    <!-- Main Content Area -->
    <div class="drawer-content flex flex-col h-screen">
      <!-- Minimal Top Bar (Non-Editor Only) -->
      <header v-if="!isEditorPage" class="flex items-center justify-between p-4 bg-base-100 border-b border-base-300 z-50">
        <div class="flex items-center gap-3">
          <label for="my-drawer-2" class="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-4 h-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
        <h1 class="text-xl font-bold text-base-content">Flow Forge</h1>
        </div>

        <div class="dropdown dropdown-bottom dropdown-end">
          <button
            tabindex="0"
            role="button"
            class="btn btn-ghost btn-sm"
            title="Change Theme"
          >
            <Sun v-if="selectedTheme === 'light'" class="w-4 h-4" />
            <Moon v-else-if="selectedTheme === 'dark'" class="w-4 h-4" />
            <Monitor v-else class="w-4 h-4" />
          </button>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 text-base-content border border-base-300">
            <li><button type="button" @click="setTheme('auto')" class="flex items-center gap-2">
              <Monitor class="w-4 h-4" />
              System
              <span v-if="selectedTheme === 'auto'" class="ml-auto">✓</span>
            </button></li>
            <li><button type="button" @click="setTheme('light')" class="flex items-center gap-2">
              <Sun class="w-4 h-4" />
              Light
              <span v-if="selectedTheme === 'light'" class="ml-auto">✓</span>
            </button></li>
            <li><button type="button" @click="setTheme('dark')" class="flex items-center gap-2">
              <Moon class="w-4 h-4" />
              Dark
              <span v-if="selectedTheme === 'dark'" class="ml-auto">✓</span>
            </button></li>
          </ul>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto bg-base-200 relative">
        <!-- Clean Floating Navigation (Editor Only) -->
        <div v-if="isEditorPage" class="fixed top-4 left-4 z-50">
          <div class="flex items-center gap-2 bg-base-100 rounded-lg shadow-lg border border-base-300 p-2">
            <!-- Navigation -->
            <label for="my-drawer-2" class="btn btn-ghost btn-sm" title="Toggle Sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-4 h-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
            
            <!-- Theme -->
            <div class="flex items-center gap-1 border-l border-base-300 ml-2 pl-2">
              <div class="dropdown dropdown-bottom">
                <button
                  tabindex="0"
                  role="button"
                  class="btn btn-ghost btn-sm"
                  title="Change Theme"
                >
                  <Sun v-if="selectedTheme === 'light'" class="w-4 h-4" />
                  <Moon v-else-if="selectedTheme === 'dark'" class="w-4 h-4" />
                  <Monitor v-else class="w-4 h-4" />
                </button>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 text-base-content border border-base-300">
                  <li><button type="button" @click="setTheme('auto')" class="flex items-center gap-2">
                    <Monitor class="w-4 h-4" />
                    System
                    <span v-if="selectedTheme === 'auto'" class="ml-auto">✓</span>
                  </button></li>
                  <li><button type="button" @click="setTheme('light')" class="flex items-center gap-2">
                    <Sun class="w-4 h-4" />
                    Light
                    <span v-if="selectedTheme === 'light'" class="ml-auto">✓</span>
                  </button></li>
                  <li><button type="button" @click="setTheme('dark')" class="flex items-center gap-2">
                    <Moon class="w-4 h-4" />
                    Dark
                    <span v-if="selectedTheme === 'dark'" class="ml-auto">✓</span>
                  </button></li>
                </ul>
              </div>
            </div>
        </div>
      </div>

        <slot />
      </main>
    </div>
    
    <!-- Sidebar -->
    <div class="drawer-side z-[60]">
      <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="w-80 min-h-full bg-base-100 text-base-content flex flex-col">
        <!-- Sidebar Header -->
        <div class="p-4 border-b border-base-300">
          <h2 class="text-xl font-bold text-base-content">Flow Forge</h2>
          </div>
        
        <!-- Navigation Menu -->
        <nav class="flex-1 p-4">
          <ul class="menu">
            <li><RouterLink to="/" class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </RouterLink></li>
            <li><RouterLink to="/templates" class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Templates
            </RouterLink></li>
            <li><RouterLink to="/editor" class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editor
            </RouterLink></li>
      </ul>
        </nav>
      </aside>
    </div>
  </div>
</template> 