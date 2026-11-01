<template>
  <div class="content-inner">
    <div class="sec-head page-head">
      <h2>{{ $t("todos.title") }}</h2>
      <span class="count">{{
        $t(
          "todos.progress",
          { done: doneItems.length, n: store.todos.length },
          store.todos.length,
        )
      }}</span>
      <span class="line" />
      <v-btn
        class="page-head-action"
        color="primary"
        size="small"
        aria-haspopup="dialog"
        @click="openTaskModal({ allowTodo: true })"
      >
        <v-icon size="15" start>mdi-plus</v-icon>{{ $t("todos.add") }}
      </v-btn>
    </div>

    <AppSkeleton v-if="!store.bootstrapped" :count="4" />
    <div v-else-if="!store.todos.length" class="empty">
      <v-icon class="empty-icon">mdi-checkbox-marked-outline</v-icon>
      <h3>{{ $t("todos.emptyTitle") }}</h3>
      <p>{{ $t("todos.emptyBody") }}</p>
    </div>

    <TodoItem v-for="item in pendingItems" :key="item.id" :item="item" />

    <div class="sec-head" style="margin-top: 26px">
      <h2 style="font-size: 16px">{{ $t("dashboard.weeklyTasks") }}</h2>
      <span class="count">{{
        $t("todos.tasksProgress", {
          done: store.tasks.length - pendingTasks.length,
          n: store.tasks.length,
        })
      }}</span>
      <span class="line" />
      <v-btn
        to="/dashboard"
        variant="text"
        size="small"
        append-icon="mdi-arrow-right"
      >
        {{ $t("todos.openHome") }}
      </v-btn>
    </div>
    <p
      v-if="store.bootstrapped && !pendingTasks.length"
      class="todo-tasks-empty"
    >
      {{ store.tasks.length ? $t("todos.allTasksDone") : $t("todos.noTasks") }}
    </p>
    <DashboardTaskRow
      v-for="task in pendingTasks"
      :key="task.id"
      :task="task"
      @edit="openTaskModal({ task })"
    />

    <template v-if="doneItems.length">
      <div class="sec-head" style="margin-top: 18px">
        <h2 style="font-size: 16px">{{ $t("todos.completed") }}</h2>
        <span class="line" />
        <button class="btn btn-ghost btn-sm" @click="store.clearDoneTodos()">
          <v-icon style="font-size: 15px">mdi-broom</v-icon>
          {{ $t("todos.clearCompleted") }}
        </button>
      </div>
      <TodoItem v-for="item in doneItems" :key="item.id" :item="item" />
    </template>

    <v-dialog v-model="taskModalOpen" max-width="480" class="qh-dialog">
      <DashboardTaskModal
        :key="modalKey"
        :task="modalTask?.task ?? null"
        :allow-todo="modalTask?.allowTodo"
        @close="modalTask = null"
        @saved="modalTask = null"
      />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Task } from "~/stores/home";
import { useHomeStore } from "~/stores/home";

definePageMeta({ middleware: "auth" });

const store = useHomeStore();

const pendingItems = computed(() => store.todos.filter((i) => !i.done));
const doneItems = computed(() => store.todos.filter((i) => i.done));

const modalTask = ref<{ task?: Task; allowTodo?: boolean } | null>(null);
const modalKey = ref(0);

function openTaskModal(target: { task?: Task; allowTodo?: boolean }) {
  modalKey.value += 1;
  modalTask.value = target;
}

const taskModalOpen = computed({
  get: () => modalTask.value !== null,
  set: (v) => {
    if (!v) modalTask.value = null;
  },
});

function taskOwnerRank(task: Task) {
  if (task.assignee === store.currentUserId) return 0;
  return task.assignee ? 2 : 1;
}

const pendingTasks = computed(() =>
  store.tasks
    .filter((tk) => !tk.done)
    .sort((a, b) => taskOwnerRank(a) - taskOwnerRank(b)),
);
</script>

<style scoped>
.todo-tasks-empty {
  font-size: 13px;
  color: var(--ink-3);
  margin: 0 2px 8px;
}
</style>
