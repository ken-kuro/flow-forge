<script setup>
const templates = [
  { id: 1, title: 'Customer Support FAQ', description: 'A simple flow to answer frequently asked questions.' },
  { id: 2, title: 'Lead Generation Bot', description: 'Capture user information and qualify leads.' },
  { id: 3, title: 'Appointment Booking', description: 'Schedule meetings and appointments with users.' },
  { id: 4, title: 'Blank Canvas', description: 'Start from scratch with an empty flow.' }
]
</script>

<template>
  <div class="p-4 md:p-8">
    <h1 class="text-3xl font-bold mb-6 text-base-content">Choose a Template</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="template in templates" :key="template.id" class="card bg-base-100 shadow-xl min-w-72 text-base-content">
        <div class="card-body">
          <h2 class="card-title">{{ template.title }}</h2>
          <p>{{ template.description }}</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary">Use Template</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 