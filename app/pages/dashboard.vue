<template>
  <div class="content-inner">
    <div ref="statsEl" class="stat-row">
      <div class="stat">
        <div>
          <div class="lbl">{{ $t("dashboard.tasksDone") }}</div>
          <div class="num">
            {{ doneCount }}<small> / {{ store.tasks.length }}</small>
          </div>
        </div>
        <ProgressRing
          :pct="Math.round((doneCount / Math.max(1, store.tasks.length)) * 100)"
        />
      </div>
      <div class="stat">
        <div>
          <div class="lbl">{{ $t("dashboard.yourPoints") }}</div>
          <div class="num">{{ store.me.weekXp }}<small> XP</small></div>
        </div>
        <AppAvatar :member="store.me" size="lg" />
      </div>
      <div class="stat">
        <div>
          <div class="lbl">{{ $t("dashboard.householdTotal") }}</div>
          <div class="num">{{ hhXp }}<small> XP</small></div>
        </div>
        <div class="avatar-stack">
          <AppAvatar
            v-for="m in store.activeMembers.slice(0, 4)"
            :key="m.id"
            :member="m"
            size="md"
          />
        </div>
      </div>
    </div>

    <div class="sec-head">
      <h2>{{ $t("dashboard.weeklyTasks") }}</h2>
      <span class="line" />
      <v-btn-toggle
        v-model="filter"
        mandatory
        density="compact"
        variant="outlined"
        rounded="sm"
        class="seg"
      >
        <v-btn value="all" size="small">{{ $t("dashboard.filterAll") }}</v-btn>
        <v-btn value="mine" size="small">{{
          $t("dashboard.filterMine")
        }}</v-btn>
        <v-btn value="open" size="small">{{
          $t("dashboard.filterOpen")
        }}</v-btn>
      </v-btn-toggle>
      <v-btn color="primary" size="small" @click="modalTask = {}">
        <v-icon size="15" start>mdi-plus</v-icon>{{ $t("dashboard.newTask") }}
      </v-btn>
    </div>

    <div class="dash-grid">
      <div ref="taskListEl">
        <AppSkeleton v-if="!store.bootstrapped" variant="card" :count="3" />
        <div v-else-if="!byRoom.length" class="empty">
          <v-icon class="empty-icon">mdi-broom</v-icon>
          <h3>{{ $t("dashboard.emptyTitle") }}</h3>
          <p>{{ $t("dashboard.emptyBody") }}</p>
        </div>
        <div v-for="{ room, items } in byRoom" :key="room.id" class="room">
          <div class="room-head">
            <span class="room-ic"
              ><v-icon style="font-size: 18px">{{ room.icon }}</v-icon></span
            >
            <h3>{{ room.name }}</h3>
            <span class="meta"
              >·
              {{
                $t("dashboard.task", { n: items.length }, items.length)
              }}</span
            >
            <span class="prog"
              >{{ items.filter((t) => t.done).length }}/{{ items.length }}
              {{ $t("dashboard.done") }}</span
            >
          </div>
          <DashboardTaskRow
            v-for="task in items"
            :key="task.id"
            :task="task"
            @edit="modalTask = { task }"
          />
        </div>
      </div>
      <DashboardLeaderboard />
    </div>

    <v-dialog v-model="taskModalOpen" max-width="480" class="qh-dialog">
      <DashboardTaskModal
        :task="modalTask?.task ?? null"
        @close="modalTask = null"
        @saved="modalTask = null"
      />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import type { Task } from "~/stores/home";
import { useHomeStore } from "~/stores/home";
import { useAnimations } from "~/composables/useAnimations";

definePageMeta({ middleware: "auth" });

const store = useHomeStore();
const { animateStagger } = useAnimations();

const filter = ref("all");
const taskListEl = ref<HTMLElement | null>(null);
const modalTask = ref<{ task?: Task } | null>(null);

watch(filter, async () => {
  await nextTick();
  const rooms = taskListEl.value?.querySelectorAll(".room");
  if (rooms?.length) animateStagger(rooms);
});
const taskModalOpen = computed({
  get: () => modalTask.value !== null,
  set: (v) => {
    if (!v) modalTask.value = null;
  },
});

const statsEl = ref<HTMLElement | null>(null);

const doneCount = computed(() => store.tasks.filter((t) => t.done).length);
const hhXp = computed(() => store.members.reduce((s, m) => s + m.weekXp, 0));

const visibleTasks = computed(() => {
  return store.tasks.filter((tk) => {
    if (filter.value === "mine") return tk.assignee === store.currentUserId;
    if (filter.value === "open") return !tk.assignee && !tk.done;
    return true;
  });
});

const byRoom = computed(() =>
  store.rooms
    .map((r) => ({
      room: r,
      items: visibleTasks.value.filter((t) => t.roomId === r.id),
    }))
    .filter((g) => g.items.length),
);

onMounted(() => {
  if (statsEl.value) {
    animateStagger(statsEl.value.querySelectorAll(".stat"));
  }
});
</script>
