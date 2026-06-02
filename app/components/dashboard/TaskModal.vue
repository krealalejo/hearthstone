<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>{{ task ? "Edit task" : "New task" }}</h2>
      <p v-if="!task">Add a chore and assign points</p>
      <div style="position: absolute; top: 0; right: 0">
        <button
          class="btn btn-ghost btn-icon btn-sm"
          style="border: 0"
          @click="emit('close')"
        >
          <v-icon>mdi-close</v-icon>
        </button>
      </div>
    </div>
    <div class="modal-body">
      <div class="field">
        <label>Title</label>
        <input
          v-model="form.title"
          placeholder="e.g. Clean the windows"
          autofocus
        />
      </div>
      <div class="field">
        <label
          >Description
          <span style="color: var(--ink-3); font-weight: 400"
            >· optional</span
          ></label
        >
        <textarea v-model="form.desc" placeholder="Any details…" />
      </div>
      <div class="field">
        <label>Room</label>
        <div class="pick-grid">
          <button
            v-for="r in store.rooms"
            :key="r.id"
            class="pick"
            :class="{ on: form.roomId === r.id }"
            @click="form.roomId = r.id"
          >
            <v-icon style="font-size: 15px">{{ r.icon }}</v-icon
            >{{ r.name }}
          </button>
        </div>
      </div>
      <div class="field">
        <label>Assign to</label>
        <div class="pick-grid">
          <button
            class="pick"
            :class="{ on: form.assignee === null }"
            @click="form.assignee = null"
          >
            <v-icon style="font-size: 15px">mdi-account-group</v-icon>Anyone
          </button>
          <button
            v-for="m in store.activeMembers"
            :key="m.id"
            class="pick"
            :class="{ on: form.assignee === m.id }"
            @click="form.assignee = m.id"
          >
            <AppAvatar :member="m" size="sm" />{{ m.name.split(" ")[0] }}
          </button>
        </div>
      </div>
      <div class="field">
        <label>Effort · {{ form.xp }} XP</label>
        <div class="xp-pick">
          <button
            v-for="opt in XP_OPTS"
            :key="opt.n"
            class="xp-opt"
            :class="{ on: form.xp === opt.n }"
            @click="form.xp = opt.n"
          >
            <div class="xp-n">{{ opt.n }}</div>
            <div class="xp-l">{{ opt.l }}</div>
          </button>
        </div>
      </div>
      <label
        class="pick"
        style="justify-content: space-between; cursor: pointer"
        @click="form.recurring = !form.recurring"
      >
        <span style="display: flex; align-items: center; gap: 8px">
          <v-icon style="font-size: 15px">mdi-sync</v-icon>Recurring weekly
        </span>
        <span class="check" :class="{ done: form.recurring }">
          <v-icon v-if="form.recurring" style="font-size: 15px"
            >mdi-check</v-icon
          >
        </span>
      </label>
    </div>
    <div class="modal-foot">
      <button
        v-if="task"
        class="btn btn-ghost"
        style="margin-right: auto; color: oklch(0.55 0.15 25)"
        @click="handleDelete"
      >
        <v-icon style="font-size: 15px">mdi-trash-can</v-icon>Delete
      </button>
      <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
      <button
        class="btn btn-primary"
        :disabled="!form.title.trim()"
        @click="handleSave"
      >
        {{ task ? "Save changes" : "Add task" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import type { Task } from "~/stores/home";
import { useHomeStore } from "~/stores/home";

const props = defineProps<{ task?: Task | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const store = useHomeStore();

const XP_OPTS = [
  { n: 5, l: "Quick" },
  { n: 10, l: "Light" },
  { n: 20, l: "Medium" },
  { n: 35, l: "Hard" },
  { n: 50, l: "Deep" },
];

const form = reactive({
  title: props.task?.title ?? "",
  desc: props.task?.desc ?? "",
  roomId: props.task?.roomId ?? store.rooms[0]?.id ?? "",
  assignee: props.task?.assignee ?? (null as string | null),
  xp: props.task?.xp ?? 10,
  recurring: props.task?.recurring ?? true,
});

function handleSave() {
  if (!form.title.trim()) return;
  store.saveTask({
    ...(props.task ? { id: props.task.id } : {}),
    title: form.title.trim(),
    desc: form.desc.trim(),
    roomId: form.roomId,
    assignee: form.assignee,
    xp: form.xp,
    recurring: form.recurring,
  });
  emit("saved");
  emit("close");
}

function handleDelete() {
  if (props.task) store.deleteTask(props.task.id);
  emit("close");
}
</script>
