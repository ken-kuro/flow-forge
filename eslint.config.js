import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from '@vue/eslint-config-prettier'
import globals from 'globals'

export default [
    {
        name: 'app/files-to-ignore',
        ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**'],
    },

    // Basic recommended configs
    js.configs.recommended,
    // TODO: Switch to higher level like strongly-recommended or recommended when we have more time to review the rules
    ...pluginVue.configs['flat/essential'],
    prettier,

    {
        name: 'app/global-settings',
        files: ['**/*.{js,mjs,jsx,vue}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.vitest,
            },
        },
        rules: {
            // Minimal, essential rules only
            'no-console': 'warn',
            'no-unused-vars': 'warn',
            'vue/component-name-in-template-casing': [
                'error',
                'PascalCase',
                {
                    registeredComponentsOnly: true,
                    ignores: [],
                },
            ],
        },
    },
]
