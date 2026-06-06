<template>
  <div class="content-inner">
    <div ref="statsEl" class="stat-row">
      <div class="stat">
        <div>
          <div class="lbl">Tasks done</div>
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
          <div class="lbl">Your points</div>
          <div class="num">{{ store.me.weekXp }}<small> XP</small></div>
        </div>
        <AppAvatar :member="store.me" size="lg" />
      </div>
      <div class="stat">
        <div>
          <div class="lbl">Household total</div>
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
      <h2>Weekly tasks</h2>
      <span class="line" />
      <v-btn-toggle
        v-model="filter"
        mandatory
        density="compact"
        variant="outlined"
        rounded="sm"
        class="seg"
      >
        <v-btn value="all" size="small">All</v-btn>
        <v-btn value="mine" size="small">Mine</v-btn>
        <v-btn value="open" size="small">Up for grabs</v-btn>
      </v-btn-toggle>
      <v-btn color="primary" size="small" @click="modalTask = {}">
        <v-icon size="15" start>mdi-plus</v-icon>New task
      </v-btn>
    </div>

    <div class="dash-grid">
      <div ref="taskListEl">
        <div v-if="!byRoom.length" class="empty">
          <v-icon class="empty-icon">mdi-broom</v-icon>
          <h3>Nothing here yet</h3>
          <p>No tasks match this filter. Try "All" or add a new task.</p>
        </div>
        <div v-for="{ room, items } in byRoom" :key="room.id" class="room">
          <div class="room-head">
            <span class="room-ic"
              ><v-icon style="font-size: 18px">{{ room.icon }}</v-icon></span
            >
            <h3>{{ room.name }}</h3>
            <span class="meta"
              >· {{ items.length }} task{{
                items.length !== 1 ? "s" : ""
              }}</span
            >
            <span class="prog"
              >{{ items.filter((t) => t.done).length }}/{{
                items.length
              }}
              done</span
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
    if (filter.value === "mine") return tk.assignee === store.currentUser;
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
