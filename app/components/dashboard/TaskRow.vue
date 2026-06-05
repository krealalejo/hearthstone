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
    <div class="task-body" style="cursor: pointer" @click="emit('edit')">
      <div class="task-title">{{ task.title }}</div>
      <div v-if="task.desc || task.recurring" class="task-desc">
        <span v-if="task.recurring"
          ><v-icon style="font-size: 11px">mdi-sync</v-icon> weekly</span
        >
        <span v-if="task.recurring && task.desc"> · </span>
        {{ task.desc }}
      </div>
    </div>
    <div class="task-side">
      <span v-if="gameLevel !== 'subtle'" class="chip chip-xp">
        <v-icon style="font-size: 13px">mdi-diamond-stone</v-icon>{{ task.xp }}
      </span>
      <span v-else class="chip">{{ task.xp }} XP</span>
      <div v-if="assignee" class="assignee" :title="assignee.name">
        <AppAvatar :member="assignee" size="sm" />
      </div>
      <button v-else class="claim-btn" @click="store.claimTask(task.id)">
        Claim
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Task } from "~/stores/home";
import { useHomeStore } from "~/stores/home";
import { useAnimations } from "~/composables/useAnimations";
import { useConfetti } from "~/composables/useConfetti";

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{ edit: [] }>();

const store = useHomeStore();
const { animateCheckToggle } = useAnimations();
const { fire } = useConfetti();

const gameLevel: string = "balanced";
const rowEl = ref<HTMLElement | null>(null);

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
