<template>
  <svg width="54" height="54" viewBox="0 0 54 54">
    <circle
      cx="27"
      cy="27"
      :r="r"
      fill="none"
      stroke="var(--surface-2)"
      stroke-width="5"
    />
    <circle
      cx="27"
      cy="27"
      :r="r"
      fill="none"
      stroke="var(--accent)"
      stroke-width="5"
      stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="offset"
      transform="rotate(-90 27 27)"
      style="transition: stroke-dashoffset 0.6s cubic-bezier(0.32, 0.72, 0, 1)"
    />
    <text
      x="27"
      y="31"
      text-anchor="middle"
      font-size="14"
      font-weight="700"
      fill="var(--ink-2)"
      font-family="var(--font-ui)"
    >
      {{ pct }}%
    </text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ pct: number }>();
const r = 23;
const circumference = 2 * Math.PI * r;
const offset = computed(() => circumference * (1 - props.pct / 100));
</script>
