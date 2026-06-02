<template>
  <div class="stepper">
    <button
      :disabled="value <= min"
      aria-label="decrease"
      @click="emit('change', value - 1)"
    >
      <v-icon style="font-size: 16px">mdi-minus</v-icon>
    </button>
    <span class="val">{{ value }}</span>
    <button aria-label="increase" @click="emit('change', value + 1)">
      <v-icon style="font-size: 16px">mdi-plus</v-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ value: number; min?: number }>(), { min: 0 });
const emit = defineEmits<{ change: [v: number] }>();
</script>
