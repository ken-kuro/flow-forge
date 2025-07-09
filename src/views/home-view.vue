<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
    <div class="hero min-h-full bg-base-200">
        <div class="hero-content text-center text-base-content">
            <div class="max-w-md">
                <h1 class="text-5xl font-bold">Welcome to Flow Forge</h1>
                <p class="py-6">
                    The modern, Chatfuel-style flow editor built with Vue 3. Create intuitive visual workflows with
                    ease.
                </p>
                <RouterLink to="/editor" class="btn btn-primary">Get Started</RouterLink>
            </div>
        </div>
    </div>
</template>
