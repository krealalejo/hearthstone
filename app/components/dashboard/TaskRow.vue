<template>
  <div ref="rowEl" class="task" :class="{ done: task.done }">
    <button
      class="check"
      :class="{ done: task.done }"
      aria-label="toggle"
      @click="handleToggle"
    >
      <v-icon v-if="task.done" style="font-size: 15px">mdi-check-bold</v-icon>
    </button>
    <button
      type="button"
      class="plain-button task-body"
      style="cursor: pointer"
      @click="emit('edit')"
    >
      <span class="task-title">{{ task.title }}</span>
      <span v-if="task.desc || task.recurring" class="task-desc">
        <span v-if="task.recurring"
          ><v-icon style="font-size: 11px">mdi-sync</v-icon> {{ repeatLabel }}</span
        >
        <span v-if="task.recurring && task.desc"> · </span>
        {{ task.desc }}
      </span>
    </button>
    <div class="task-side">
      <span v-if="gameLevel !== 'subtle'" class="chip chip-xp">
        <v-icon style="font-size: 13px">mdi-diamond-stone</v-icon>{{ task.xp }}
      </span>
      <span v-else class="chip">{{ task.xp }} XP</span>
      <div v-if="assignee" class="assignee" :title="assignee.name">
        <AppAvatar :member="assignee" size="sm" />
      </div>
      <button v-else class="claim-btn" @click="store.claimTask(task.id)">
        {{ t("task.claim") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Task } from "~/types/home";
import { useHomeStore } from "~/stores/home";
import { useAnimations } from "~/composables/useAnimations";
import { useConfetti } from "~/composables/useConfetti";

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{ edit: [] }>();

const store = useHomeStore();
const { t } = useI18n();
const { animateCheckToggle } = useAnimations();
const { fire } = useConfetti();

const gameLevel: string = "balanced";
const rowEl = ref<HTMLElement | null>(null);

const SINGLE_REPEAT_KEYS = {
  day: "task.daily",
  week: "task.weekly",
  month: "task.monthly",
} as const;
const MULTI_REPEAT_KEYS = {
  day: "task.everyDays",
  week: "task.everyWeeks",
  month: "task.everyMonths",
} as const;

const repeatLabel = computed(() => {
  const every = props.task.repeatEvery ?? 1;
  const unit = props.task.repeatUnit ?? "week";
  return every === 1
    ? t(SINGLE_REPEAT_KEYS[unit])
    : t(MULTI_REPEAT_KEYS[unit], { n: every });
});

const assignee = computed(
  () => store.members.find((m) => m.id === props.task.assignee) ?? null,
);

onMounted(() => {});

function handleToggle() {
  const el = rowEl.value?.querySelector(".check");
  const willDo = !props.task.done;
  animateCheckToggle(el ?? null, willDo);
  if (willDo && props.task.xp >= 30) fire();
  store.toggleTask(props.task.id);
}
</script>
