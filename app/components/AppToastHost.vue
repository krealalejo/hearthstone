<template>
  <div class="toast-wrap">
    <TransitionGroup name="toast">
      <div
        v-for="t in store.toasts"
        :key="t.id"
        class="toast"
        :class="{ clickable: !!t.link }"
        @click="t.link && handleLink(t.link)"
        @vue:mounted="onToastMounted"
      >
        <span class="t-ic">
          <v-icon style="font-size: 16px">{{ iconFor(t.kind) }}</v-icon>
        </span>
        <span
          ><b>{{ t.title }}</b
          ><span v-if="t.body" style="opacity: 0.85">
            · {{ t.body }}</span
          ></span
        >
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useHomeStore } from "~/stores/home";
import { useAnimations } from "~/composables/useAnimations";
import { useConfetti } from "~/composables/useConfetti";

const store = useHomeStore();
const router = useRouter();
const { animateToastIn } = useAnimations();
const { fire: fireConfetti } = useConfetti();

const DISMISS_DELAY = 3600;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

watch(
  () => store.toasts,
  (toasts) => {
    toasts.forEach((t) => {
      if (!timers.has(t.id)) {
        const timer = setTimeout(() => {
          store.dismissToast(t.id);
          timers.delete(t.id);
        }, DISMISS_DELAY);
        timers.set(t.id, timer);
      }
    });
    // fire confetti for celebrate toasts at non-subtle game level
    const last = toasts[toasts.length - 1];
    if (last?.celebrate) {
      fireConfetti();
    }
  },
  { deep: true },
);

function iconFor(kind: string) {
  return (
    {
      xp: "mdi-sparkles",
      restock: "mdi-auto-fix",
      check: "mdi-check-circle",
      info: "mdi-information",
    }[kind] ?? "mdi-bell"
  );
}

function handleLink(link: string) {
  router.push("/" + link);
}

function onToastMounted(el: Element) {
  animateToastIn(el);
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s var(--ease);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.94);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
</style>
