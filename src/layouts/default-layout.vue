<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { useColorMode, useStorage } from '@vueuse/core'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

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
    <div class="drawer-content flex flex-col h-screen">
      <!-- Main content header -->
      <div class="flex items-center gap-2 p-4 bg-base-100 border-b border-base-300">
        <label for="my-drawer-2" class="btn btn-square btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current text-base-content"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
        <h1 class="text-xl font-bold text-base-content">Flow Forge</h1>
        <div class="flex-1"></div>

        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle text-base-content">
            <Sun v-if="selectedTheme === 'light'" />
            <Moon v-else-if="selectedTheme === 'dark'" />
            <Monitor v-else />
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 text-base-content">
            <li><a @click="setTheme('auto')">
              <Monitor class="inline-block w-4 h-4 mr-2" />
              System
              <span v-if="selectedTheme === 'auto'">✓</span>
            </a></li>
            <li><a @click="setTheme('light')">
              <Sun class="inline-block w-4 h-4 mr-2" />
              Light
              <span v-if="selectedTheme === 'light'">✓</span>
            </a></li>
            <li><a @click="setTheme('dark')">
              <Moon class="inline-block w-4 h-4 mr-2" />
              Dark
              <span v-if="selectedTheme === 'dark'">✓</span>
            </a></li>
          </ul>
        </div>
      </div>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto bg-base-200">
        <RouterView />
      </main>
    </div>
    <div class="drawer-side">
      <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-100 text-base-content">
        <!-- Sidebar content here -->
        <li class="mb-4">
          <div class="text-2xl font-bold">
            Flow Forge
          </div>
        </li>
        <li><RouterLink to="/">Home</RouterLink></li>
        <li><RouterLink to="/templates">Templates</RouterLink></li>
        <li><RouterLink to="/editor">Editor</RouterLink></li>
      </ul>
    </div>
  </div>
</template> 