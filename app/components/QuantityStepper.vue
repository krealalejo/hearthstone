<template>
  <div class="stepper">
    <button
      :disabled="local <= min"
      aria-label="decrease"
      @click="step(-1)"
    >
      <v-icon style="font-size: 16px">mdi-minus</v-icon>
    </button>
    <span class="val">{{ local }}</span>
    <button aria-label="increase" @click="step(1)">
      <v-icon style="font-size: 16px">mdi-plus</v-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";

const props = withDefaults(
  defineProps<{ value: number; min?: number; delay?: number }>(),
  { min: 0, delay: 400 },
);
const emit = defineEmits<{ change: [v: number] }>();

const local = ref(props.value);
let timer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.value,
  (v) => {
    if (!timer) local.value = v;
  },
);

function flush() {
  if (!timer) return;
  clearTimeout(timer);
  timer = null;
  emit("change", local.value);
}

function step(delta: number) {
  const next = Math.max(props.min, local.value + delta);
  if (next === local.value) return;
  local.value = next;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    emit("change", local.value);
  }, props.delay);
}

onBeforeUnmount(flush);
</script>
