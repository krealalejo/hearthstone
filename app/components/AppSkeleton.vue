<template>
  <div class="skeleton" :class="`skeleton-${variant}`" aria-hidden="true">
    <div v-for="n in count" :key="n" class="sk-block">
      <span class="sk-line sk-a" />
      <span class="sk-line sk-b" />
      <span class="sk-line sk-c" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ variant?: "row" | "card" | "grid"; count?: number }>(),
  { variant: "row", count: 3 },
);
</script>
