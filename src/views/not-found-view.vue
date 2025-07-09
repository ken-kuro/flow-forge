<template>
    <div class="not-found-view flex flex-col items-center justify-center h-screen bg-base-200 text-base-content">
        <h1 class="text-8xl font-bold text-primary">404</h1>
        <h2 class="text-3xl font-semibold mt-4 mb-2">Page Not Found</h2>
        <p class="text-lg mb-8 text-base-content/70">Sorry, the page you are looking for does not exist.</p>
        <router-link to="/" class="btn btn-primary"> Go to Homepage </router-link>
    </div>
</template>

<script setup>
// No script logic is needed for this simple static view.
</script>

<style scoped>
.not-found-view {
    text-align: center;
}
</style>
