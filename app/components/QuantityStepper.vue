<template>
  <div class="stepper">
    <button
      :disabled="local <= min"
      :aria-label="t('a11y.decrease')"
      @click="step(-1)"
    >
      <v-icon style="font-size: 16px">mdi-minus</v-icon>
    </button>
    <input
      class="val"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      :value="draft ?? local"
      :aria-label="t('a11y.quantity')"
      @focus="onFocus"
      @input="onInput"
      @keydown.enter="($event.target as HTMLInputElement).blur()"
      @blur="commit"
    />
    <button :aria-label="t('a11y.increase')" @click="step(1)">
      <v-icon style="font-size: 16px">mdi-plus</v-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{ value: number; min?: number; delay?: number }>(),
  { min: 0, delay: 400 },
);
const emit = defineEmits<{ change: [v: number] }>();

const local = ref(props.value);
const draft = ref<string | null>(null);
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

function onFocus(event: FocusEvent) {
  draft.value = String(local.value);
  (event.target as HTMLInputElement).select();
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/\D/g, "");
  input.value = digits;
  draft.value = digits;
}

function commit() {
  const typed = draft.value;
  draft.value = null;
  if (!typed) return;
  const next = Math.max(props.min, Number.parseInt(typed, 10));
  if (next === local.value && !timer) return;
  local.value = next;
  if (timer) clearTimeout(timer);
  timer = null;
  emit("change", next);
}

onBeforeUnmount(flush);
</script>
