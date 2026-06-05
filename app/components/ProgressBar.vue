<template>
  <div class="bar">
    <i :style="{ width: pct + '%', background: color }" />
    <span
      v-if="minMark != null && max > 0"
      class="min-mark"
      :style="{ left: minMarkPct + '%' }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;
    max: number;
    color?: string;
    minMark?: number;
  }>(),
  { color: "var(--accent)" },
);

const pct = computed(() =>
  Math.max(0, Math.min(100, (props.value / Math.max(1, props.max)) * 100)),
);
const minMarkPct = computed(() =>
  props.minMark == null
    ? 0
    : Math.min(100, (props.minMark / Math.max(1, props.max)) * 100),
);
</script>
