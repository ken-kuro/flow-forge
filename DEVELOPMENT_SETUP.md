# Development Setup - Production Grade Tooling

This document outlines the production-grade development tools and configurations that have been set up for the Flow Forge project.

## 🛠️ Tools Installed

### Code Quality & Formatting

- **ESLint** (^9.30.1) - JavaScript/Vue linting with flat config
- **Prettier** (latest) - Code formatting
- **@vue/eslint-config-prettier** - ESLint + Prettier integration for Vue

### Git Hooks & Automation

- **Husky** (latest) - Git hooks management
- **lint-staged** (latest) - Run linters on staged files
- **@commitlint/cli** + **@commitlint/config-conventional** - Commit message linting

### Testing Framework

- **Vitest** (latest) - Fast unit testing framework built for Vite
- **@vue/test-utils** (latest) - Vue component testing utilities
- **jsdom** (latest) - DOM environment for testing

## 📁 Configuration Files

### ESLint Configuration (`eslint.config.js`)

- Modern flat config format
- Vue 3 + Composition API rules
- Browser globals defined (console, setTimeout, etc.)
- Prettier integration
- Custom rules for Vue component structure

### Prettier Configuration (`.prettierrc`)

```json
{
    "semi": false,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100,
    "bracketSpacing": true,
    "arrowParens": "avoid",
    "endOfLine": "lf",
    "vueIndentScriptAndStyle": false,
    "htmlWhitespaceSensitivity": "ignore"
}
```

### Commit Lint Configuration (`commitlint.config.js`)

- Conventional commits format
- Custom type enum: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert
- Subject and body length limits

### Git Hooks (`.husky/`)

- **pre-commit**: Runs lint-staged on staged files
- **commit-msg**: Validates commit message format

### Lint-staged Configuration (in `package.json`)

```json
{
    "lint-staged": {
        "*.{js,jsx,vue}": ["eslint --fix", "prettier --write"],
        "*.{css,scss,html,md,json}": ["prettier --write"]
    }
}
```

## 🚀 Available Scripts

```bash
# Development
npm run dev              # Start development server

# Build
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint with auto-fix
npm run lint:check      # Run ESLint without auto-fix
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting

# Testing
npm run test            # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Run tests with coverage report
npm run test:ui         # Run tests with UI interface

# Git Hooks
npm run prepare         # Install Husky hooks (runs automatically)
```

## 🎯 VS Code Integration

### Settings (`.vscode/settings.json`)

- Format on save enabled
- ESLint auto-fix on save
- Vue-specific settings for proper casing

### Recommended Extensions (`.vscode/extensions.json`)

- Vue.volar - Vue 3 support
- Vue.vscode-typescript-vue-plugin - TypeScript support for Vue
- esbenp.prettier-vscode - Prettier integration
- dbaeumer.vscode-eslint - ESLint integration
- bradlc.vscode-tailwindcss - Tailwind CSS support

## 🔧 Current Status

### ✅ Working

- ESLint configuration with Vue 3 support
- Prettier formatting
- Git hooks (pre-commit, commit-msg)
- Lint-staged integration
- VS Code integration

### ⚠️ Known Issues to Address

1. **Browser globals**: Some files still show `no-undef` errors for browser APIs
2. **Vue prop mutations**: Several components mutate props directly (anti-pattern)
3. **Unused variables**: Some imported but unused variables
4. **Console statements**: Development console.log statements should be removed
5. **Missing prop defaults**: Some Vue props lack default values

### 🛠️ Recommended Next Steps

1. **Fix ESLint errors**:

    ```bash
    npm run lint:check  # See all issues
    npm run lint        # Auto-fix what's possible
    ```

2. **Address Vue-specific issues**:
    - Replace prop mutations with emit events
    - Add default values for required props
    - Remove unused imports

3. **Clean up development code**:
    - Remove console.log statements
    - Remove unused variables

4. **Set up CI/CD**:
    - Add GitHub Actions workflow
    - Run linting and formatting checks on PRs
    - Automated testing pipeline

## 📋 Commit Message Format

Following conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert

**Examples**:

```
feat: add user authentication
fix: resolve memory leak in flow editor
docs: update API documentation
style: format code with prettier
refactor: extract common utilities
```

## 🔍 Quality Gates

### Pre-commit Checks

- ESLint validation
- Prettier formatting
- Staged files only

### Commit Message Validation

- Conventional commit format
- Subject length limits
- Proper type usage

This setup ensures consistent code quality, formatting, and commit practices across the development team.
